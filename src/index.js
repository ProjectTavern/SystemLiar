const path = require('path');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const crossdomain = require('crossdomain');
const redis = require('./routes/database/redis');
const bodyParser = require('body-parser');

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

  /**
   * 구글 아이디를 저장하는 로직
   * 구글 아이디가 있는 경우 닉네임(string)을 바로 전송
   * 구글 아이디가 없는 경우 false 값을 전송
   * */
  request.redis.hget(userGhash, "nickname", (error, value) => {
    if (value) {
      console.log("[LOG] 유저 정보가 기존 데이터셋에 존재합니다.", value);
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
          response.send(true);
        });
    }
  });
});

/* 유저 상태 불러오기 */
app.get('/user/status/:id', (request, response ,next) => {
  const key = request.params.id;
  request.redis.get(key, (error, data) => {
    if (error) {
      console.log(error);
      response.send("[ERROR] REDIS ERROR: " + error);
      return;
    }
    const value = JSON.parse(data);
    response.json(value);
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
roomspace.on('connection', (socket) => {
  console.log('[LOG] An user connected.', socket.id);
  /**
   * 나중에 init함수로 유저에 대한 데이터를 정리하는 함수로 만들 것
   * 현재는 유저 방에 대한 정보만을 초기화 시키고 있음.
   * (연결이 유실되었다가 다시 들어오면 방이 초기화될 수 있는 문제가 있을 수도 있음)
   * */
  socket.userRooms = [];

  socket.on('join:room', (data) => {
    console.log("[LOG] join:room: ", data);
    try {
      initRoom(socket);
      if(data.type === 'joinRoom') {
        console.log("[LOG] data.type: joinRoom => valid entered.", data.type);
        socket.join(data.room);
        socket.userRooms.push(data.room);
        socket.emit('system:message', { message: '채팅방에 오신 것을 환영합니다.' });
        setNameTag(socket, data.name);
        socket.broadcast.to(data.room).emit('system:message', { message: socket.username + '님이 접속하셨습니다.' });
      }
    } catch (error) {
      console.log("[ERROR] join:room.", error);
    }
  });

  socket.on('send:message', (data) => {
    console.log("[LOG] send:message: ",data);
    try {
      roomspace.to(data.room).emit('user:message', data);
    } catch (error) {
      console.log("[ERROR] send:message.", error);
    }
  });

  socket.on('leave:room', (data) => {
    console.log('[LOG] leave:room: ', data);
    try {
      if (data.name) { console.log(`leave:room: ${data.name} is left this room.`); }
      socket.leave(data.room);
      roomspace.to(data.room).emit('system:message', { message: data.name + '님이 방에서 나가셨습니다.' });
    } catch (error) {
      console.log("[ERROR] leave:room.", error);
    }
  });

  function initRoom(socket) {
    const currentRooms = socket.userRooms;
    currentRooms.forEach((elem) => {
      socket.leave(elem);
    });
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
});

/* 서버 기동 포트: 30500 */
server.listen(30500, () => {
  console.log('[LOG] Socket IO server listening on port 30500');
});
