const path = require('path');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const crossdomain = require('crossdomain');
const redis = require('./modules/database/redis');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const socketsession = require('express-socket.io-session');

/* 임시 해쉬코드 작성 */
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};

const configDataset = {
  user : {
    ghashes : "user:ghash",
    nicknames : "user:nickname",
    status: "user:status"
  }
};

/* 바디 파서 등록 */
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

/* 응답객체에 레디스 등록 */
app.use((request, response, next) => {
  request.redis = redis;
  next();
});

/* 세션 값 생성 */
app.session = expressSession({
  secret: '&%^%SYSTEM%LIAR%^%&',
  resave: true,
  saveUninitialized: true,
  autoSave: true
});
app.use(app.session);

/* 크로스도메인 해제 : 나중에 서버 제대로 개설되면 제거 */
app.all('/crossdomain.xml', function (request, response, next) {
  response.set('Content-Type', 'application/xml; charset=utf-8');
  response.send(crossdomain({ domain: '*' }), 200);
});

/* 테스트를 위한 샘플 페이지 */
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/index.html'));
});

/* 레디스 테스트 페이지 */
app.get('/redis', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/sample_redis.html'));
});

/* 채팅 테스트 페이지 */
app.get('/chat', function(request, response) {
  response.sendFile(path.join(__dirname, '/templates/sample_chat.html'));
});

/* 유저 상태 확인 */
app.post('/user/status', (request, response, next) => {
  request.accepts('application/json');
  request.on('data', (data) => console.log("[LOG] DATA: ", data));

  const userGhash = request.body.id;
  const value = JSON.stringify(request.body);

  console.log("[LOG] 유저 조회할 받은 데이터", value);

  /**
   * 구글 아이디를 저장하는 로직
   * 구글 아이디가 있는 경우 닉네임(string)을 바로 전송
   * 구글 아이디가 없는 경우 false 값을 전송
   * */
  request.redis.hget(userGhash, "nickname", (error, value) => {
    if (value) {
      console.log("[LOG] 유저 정보가 기존 데이터셋에 존재합니다.", value);
      console.log("[LOG] 세션에 유저 정보를 저장합니다.");

      /* 세션에 데이터 저장 */
      const datas = { id: userGhash, nickname: value };
      const session = setUserInfoToSession(request, datas);
      response.send(value);
    } else {
      console.log("[LOG] 유저 정보가 기존 데이터셋에 존재하지 않습니다.", value);
      response.send(false);
    }
  });
});

/**
 * 구글 아이디 + 닉네임 저장
 * 닉네임이 사용되고 있는 것인지 체크 후에 사용 가능하면 바로 저장
 *
 * 사용가능하여 저장된 경우에는 true
 * 사용하고 있는 닉네임이 있는 경우에는 false
 * */
app.post('/user/create/nickname/', (request, response, next) => {
  request.accepts('application/json');
  request.on('data', (data) => console.log("[LOG] DATA: ", data));

  const userData = request.body;

  /* 유저 정보 배열로 전환 */
  let userInform = [];
  for ( let userInformKey in userData) {
    if (userData.hasOwnProperty(userInformKey)) {
      userInform.push(userInformKey);
      userInform.push(userData[userInformKey]);
    }
  }
  console.log("[LOG] 저장할 받은 데이터: ", userData);
  /* 유저 정보 */
  const userNickname = userData.nickname;
  const userGhashId = userData.id;

  request.redis.smembers(configDataset.user.nicknames, (error, userNicknameLists) => {
    if(userNicknameLists.includes(userNickname)) {
      console.log("[LOG] 사용자의 닉네임이 이미 존재합니다.", userNickname);
      response.send(false);
    } else {
      console.log("[LOG] 사용할 수 있는 닉네임입니다. 저장을 시작합니다.", userNickname);
      request.redis
        .multi()
        .sadd(configDataset.user.nicknames, userNickname)
        .hset(userGhashId, userInform)
        .exec((error, result) => {
          if (error) {
            console.log("[LOG] 유저의 정보를 저장하려 시도했으나 실패했습니다.", error);
            response.send(false);
          }
          console.log("[LOG] 유저의 정보를 저장했습니다.", result);
          /* 세션에 데이터 저장 */
          const datas = { id: userGhashId, nickname: userNickname };
          const session = setUserInfoToSession(request, datas);

          response.send(true);
        });
    }
  });
});

/**
 * 데이터 리셋 버튼! 주의!
 * */
app.post('/database/all/reset', (request, response, next) => {
  request.redis.flushall()
    .then(value => {
      console.log(value);
      response.send(true);
    });
});

/* socketio 채팅 */
const roomspace = io.of('/roomspace');
roomspace.use(socketsession(app.session, {
  autoSave: true
}));
let rooms = [];
const iddata = Date.now();
let roomMock1 = {
  id : iddata + 1,
  name : "아무 일도 없었다.",
  members : ["삼다수", "백두무궁", "한라삼천"],
  limit : 7,
  status : "wait",
  ready: 0
};
let roomMock2 = {
  id : iddata + 2,
  name : "방 리스트 테스트",
  members : ["카카로트", "베지터", "부르마"],
  limit : 7,
  status : "playing",
  ready: 3
};
let roomMock3 = {
  id : iddata + 3,
  name : "종료된 방",
  members : ["드레이크", "네로", "아르토리아", "에미야"],
  limit : 7,
  status : "end",
  ready: 6
};
let roomMock4 = {
  id : iddata + 4,
  name : "시작하지 않은 방",
  members : ["창세기전", "에픽세븐", "페이트그랜드오더", "슈퍼로봇대전"],
  limit : 4,
  status : "wait",
  ready: 0
};
rooms.push(roomMock1);
rooms.push(roomMock2);
rooms.push(roomMock3);
rooms.push(roomMock4);

roomspace.on('connection', socket => {
  socket.userRooms = [];
  const usersession = socket.handshake.session;
  console.log('[LOG][connection] An user connected.', socket.id);
  console.log("[LOG][connection] 소켓에 유저의 세션 정보를 불러옵니다.", usersession);

  /* 세션 데이터 취득 | 설정 */
  socket.on("user:status", data => {
    console.log("[LOG][user:status] 유저 조회할 받은 데이터", data);
    const userGhash = data.id;
    redis.hget(userGhash, "nickname", (error, value) => {
      if (value) {
        console.log("[LOG][user:status] 유저 정보가 기존 데이터셋에 존재합니다.", value);
        console.log("[LOG][user:status] 세션에 유저 정보를 저장합니다.");
        usersession.userinfo = { id: userGhash, nickname: value };
        socket.emit("user:status", value);
      } else {
        console.log("[LOG][user:status] 유저 정보가 기존 데이터셋에 존재하지 않습니다.", value);
        socket.emit("user:status", false);
      }
    });
  });

  socket.on("user:create:nickname", data => {
    console.log("[LOG][user:create:nickname] 새롭게 닉네임을 생성합니다. 전송된 데이터: ", data);
    let userInform = [];
    for ( let userInformKey in data) {
      if (data.hasOwnProperty(userInformKey)) {
        userInform.push(userInformKey);
        userInform.push(data[userInformKey]);
      }
    }

    /* 유저 정보 */
    const userNickname = data.nickname;
    const userGhashId = data.id;

    redis.smembers(configDataset.user.nicknames, (error, userNicknameLists) => {
      if(userNicknameLists.includes(userNickname)) {
        console.log("[LOG][user:create:nickname] 사용자의 닉네임이 이미 존재합니다.", userNickname);
        socket.emit("user:status", false);
      } else {
        console.log("[LOG][user:create:nickname] 사용할 수 있는 닉네임입니다. 저장을 시작합니다.", userNickname);
        redis.multi()
          .sadd(configDataset.user.nicknames, userNickname)
          .hset(userGhashId, userInform)
          .exec((error, result) => {
            if (error) {
              console.log("[LOG][user:create:nickname] 유저의 정보를 저장하려 시도했으나 실패했습니다.", error);
              socket.emit("user:status", false);
            }
            console.log("[LOG][user:create:nickname] 유저의 정보를 저장했습니다.", result);
            usersession.userinfo = { id: userGhashId, nickname: userNickname };
            socket.emit("user:status", userNickname);
          });
      }
    });
  });

  /* 방 요청이 들어온 경우 & 새로고침 누를 경우 방 정보를 재전송 */
  socket.on("rooms:refresh", () => {
    socket.emit("rooms:info", rooms);
  });

  /* 방 생성을 따로 만듬 */
  socket.on("create:room", (data) => {
    console.log("[LOG][create:room] 요청을 전송받았습니다. ", data);
    if (data.id === "create") {
      const roomId = Date.now();
      const roomData = { id : roomId, name : data.name, members : [usersession.userinfo.nickname], limit : 7, status : "wait", ready: 0 }
      rooms.push(roomData);
      console.log("[LOG][create:room] 방이 생성되었습니다.", roomData);
      /* 합쳐야할지 고민 */
      socket.join(data.id);
      socket.userRooms.push(data.id);
      setNameTag(socket, usersession.userinfo.nickname);
    }
    socket.emit("rooms:info", rooms);
  });

  /* 방에 만들 경우 */
  socket.on('join:room', data => {
    console.log("[LOG][join:room] 요청을 전송받았습니다. ", data);
    try {
      console.log("[LOG][join:room] 방 데이터들을 확인합니다.", data);
      console.log("[LOG][join:room] 방 입장/생성을 하려는 유저의 세션 정보입니다.", usersession);
      console.log("[LOG][join:room] 유저의 방 데이터를 초기화합니다.");
      initRoom(socket);

      let resultJoin = false;
      let selectedRoom = getSelectedRoom(rooms, data.id);
      if (selectedRoom.hasOwnProperty("id")) {
        console.log("[LOG][join:room] 존재하는 방입니다.", selectedRoom, isJoinable(selectedRoom, usersession.userinfo.nickname));

        if (isJoinable(selectedRoom, usersession.userinfo.nickname)) {
          console.log("[LOG][join:room] 방 입장이 가능하여 입장되었습니다. resultJoin: ", resultJoin);

          resultJoin = true;
          selectedRoom.members.push(usersession.userinfo.nickname);

          socket.join(data.id);
          socket.userRooms.push(data.id);
          setNameTag(socket, usersession.userinfo.nickname);

          socket.emit("system:message", { message: "게임에 입장하였습니다." });
          socket.broadcast.to(data.id).emit('system:message', { message: socket.username + '님이 접속하셨습니다.' });

          selectedRoom.result = resultJoin;
          socket.emit("join:room", selectedRoom);
        }

      }

    } catch (error) {
      console.log("[ERROR] join:room.", error);
    }

    function isJoinable(selectedRoom, nickname) {
      const isNotJoined = !((selectedRoom.members.filter(element => {
        return element === nickname
      })).length);
      return selectedRoom.status === "wait" && selectedRoom.members.length < selectedRoom.limit && isNotJoined;
    }
  });

  /* 대화 전송 */
  socket.on('send:message', (data) => {
    console.log("[LOG][send:message] => ",data);
    try {
      roomspace.to(data.room).emit('user:message', data);
    } catch (error) {
      console.log("[ERROR][send:message] => ", error);
    }
  });

  /* 방을 떠납니다. */
  socket.on("leave:room", data => {
    console.log("[LOG][leave:room]", data);
    try {
      initRoom(socket);
      let selectedRoom = getSelectedRoom(rooms, data.id);
      selectedRoom.members.splice(selectedRoom.members.indexOf(data.nickname), 1);
      roomspace.to(data.id).emit("system:message", { message: data.name + '님이 방에서 나가셨습니다.' });
      if (selectedRoom.members.length === 0) {
        console.log("[LOG][leave:room] 방에 아무도 없어 방을 삭제합니다.", rooms[data.number]);
        // delete selectedRoom;
      }
      socket.emit("leave:room", true);
    } catch (error) {
      console.log("[ERROR][leave:room] => ", error);
      socket.emit("leave:room", false);
    }
  });

  function initRoom(socket) {
    const currentRooms = socket.userRooms;
    currentRooms.forEach((elem) => {
      socket.leave(elem);
    });
    socket.userRooms = [];
  }

  function setNameTag(socket, name) {
    if (name) {
      socket.username = name;
    } else {
      const someones = ["A", "B", "C", "D", "E", "F"];
      const random = Math.floor(Math.random() * 6);
      socket.username = someones[random];
    }
  }

  /**
   * EmitJson의 사용으로 불필요해짐
   * 유니티 모듈 변경이 필요해진 경우 다시 사용할 수도 있음
   * */
  function parseData(data) {
    try {
      data = typeof data === "string" ? JSON.parse(data) : data;
    } catch(e) {
      console.log("[ERROR] Can not parse to JSON from string object.");
    }
    return data;
  }

  /**
   * 선택된 방을 찾음
   * */
  function getSelectedRoom(rooms, id) {
    const checkRoom = rooms.filter(element => {
      return element.id + "" === id;
    });
    console.log("check",checkRoom);
    let selectedRoom = {};
    if (checkRoom.length) {
      selectedRoom = checkRoom[0];
    }
    return selectedRoom;
  }
});

/* 서버 기동 포트: 30500 */
server.listen(30500, () => {
  console.log('[LOG][server on] Socket IO server listening on port 30500');
});


function setUserInfoToSession(request, datas) {
  let session = request.session;
  session.id = datas.id;
  session.nickname = datas.nickname;
  return session;
}
