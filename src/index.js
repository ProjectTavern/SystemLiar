const app = require('express')();
const server = require('http').createServer(app);
const pages = require('./controllers/routes/index');
const socketsession = require('express-socket.io-session');
const redis = require('./controllers/database/redis');
const io = require('socket.io')(server);
const dataScheme = require('./config/dataset');
const configure = require('./utilities/main.config');
const { logger, dataLogger } = require('./utilities/logger/winston');

// 앱 설정
configure(app);
app.use('/', pages);

const ChatSocketIO = io.of('/roomspace');
ChatSocketIO.use(socketsession(app.session, { autoSave: true }));

let rooms = [];
// const ChatProgram = require('./controllers/socketio/ChatProgramOn/index');
// ChatSocketIO.on('connection', ChatProgram);


const foods = require('./_mockup/Subjects');
const roomId = Date.now();
const roomData = {
  id : roomId,
  number: 1,
  name : 'Test',
  subject : 'Test',
  members : ['Tester'],
  limit : 7,
  status : "wait",
  ready: 0,
  readiedPlayer: [],
  host: 'Tester',
  currentUsers: [{ nickname: 'Tester', socketId: 'ok', ready: false }],
  ballotBox: [],
  senderID: []
};
rooms.push(roomData);
ChatSocketIO.on('connection', socket => {

  socket.userRooms = [];
  const usersession = socket.handshake.session;
  logger.custLog(`사용자가 접속하였습니다. 해당 사용자의 아이디는 ${socket.id} 입니다. 소켓 접속에 사용자의 세션 정보를 불러옵니다.`, usersession);

  socket.on("user:status", data => {
    const userGhash = data.id;
    logger.custLog('[user:status] 유저의 구글 아이디를 받았습니다.', data);
    redis.hget(userGhash, "nickname", (error, value) => {
      if (value) {
        logger.custLog('[user:status]사용자 정보가 기존 데이터셋에 존재합니다. 세션에 유저 정보를 저장합니다.');
        usersession.userinfo = { id: userGhash, nickname: value, socketId: socket.id };
        socket.emit("user:status", value);
      } else {
        logger.custLog(`[user:status]사용자의 정보가 기존 데이터베이스에 존재하지 않습니다. 새로운 대화명 생성 및 정보 요청을 전송합니다.`);
        socket.emit("user:status", false);
      }
    });
  });

  socket.on("user:create:nickname", data => {
    logger.custLog(`[user:create:nickname]새로운 대화명 생성 요청을 전송받았습니다.`, data);

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
    logger.custLog('[user:create:nickname]user구글 아이디', data);

    if (userNickname.split(' ').length > 1) {
      logger.custLog(`[user:create:nickname] 띄어쓰기는 불가능 합니다.`);
      socket.emit("user:status", false);
      return false;
    }


    redis.smembers(dataScheme.user.nicknames, (error, userNicknameLists) => {
      if(userNicknameLists.includes(userNickname)) {
        logger.custLog(`[user:create:nickname]사용하시려는 대화명 ${userNickname}이 이미 존재합니다. 다른 대화명 사용을 요청합니다.`);
        socket.emit("user:status", false);
      } else {
        logger.custLog(`[user:create:nickname]${userNickname}은 사용할 수 있는 대화명입니다. 데이터 베이스에 저장을 진행합니다.`);
        redis.multi()
          .sadd(dataScheme.user.nicknames, userNickname)
          .hset(userGhashId, userInform)
          .exec((error, result) => {
            if (error) {
              logger.custLog(`[user:create:nickname]사용자의 정보를 저장하려고 시도했으나 실패했습니다. 실패 보고를 전송합니다. 이유는 다음과 같습니다.`, error);
              socket.emit("[user:create:nickname]user:status", false);
            }
            logger.custLog('[user:create:nickname]사용자의 정보를 성공적으로 저장했습니다. 세션에 유저의 정보를 저장하고 성공 보고를 전송합니다.');
            usersession.userinfo = { id: userGhashId, nickname: userNickname };
            socket.emit("user:status", userNickname);
          });
      }
    });
  });

  /* 방 요청이 들어온 경우 & 새로고침 누를 경우 방 정보를 재전송 */
  socket.on("rooms:refresh", () => {
    logger.custLog(`[rooms:refresh]사용자의 요청으로 방을 새로 고침합니다.`);
    logger.custLog('방들 전체 리스트 ',rooms);
    socket.emit("rooms:info", filterRooms(rooms));
  });

  socket.on('get:subject', () => {
    redis.smembers('subject', (error, subjects) => {
      logger.custLog('주제', subjects);
      socket.emit('get:subject', subjects);
    });
  });

  /* 방 생성을 따로 만듬 */
  socket.on("create:room", (data) => {
    logger.custLog(`[create:room]거짓말쟁이 대화방 생성 요청을 전송받았습니다.`);
    try{
      if (data.id === "create") {

        let roomNumbers = [];
        let lowestRoomNumber = 1;
        logger.custLog('방데이터 전체 목록: 크리에이트:', rooms);
        rooms.forEach((room) => {
          logger.custLog(room.number);
          roomNumbers.push(room.number);
        });
        roomNumbers.sort();
        roomNumbers.forEach((number, index) => {
          logger.custLog(number + ":" + index);
          if (number !== index + 1) {
            lowestRoomNumber = index + 1;
            return false;
          }
        });

        const roomId = Date.now();
        const roomData = {
          id : roomId,
          number: lowestRoomNumber,
          name : data.name,
          subject : data.subject,
          members : [usersession.userinfo.nickname],
          limit : 7,
          status : "wait",
          ready: 0,
          readiedPlayer: [],
          host: usersession.userinfo.nickname,
          currentUsers: [{ nickname: usersession.userinfo.nickname, socketId: socket.id, ready: false }],
          ballotBox: [],
          senderID: []
        };
        rooms.push(roomData);
        logger.custLog(`[create:room]대화방 생성에 성공하였습니다.`, roomData);
        /* 합쳐야할지 고민 */
        socket.join(roomId);
        socket.userRooms.push(roomId);
        let socketSession = usersession || {};
        let userinfo = socketSession.userinfo || {};
        userinfo.room = roomId;

        setNameTag(socket, usersession.userinfo.nickname);
        socket.emit("create:room", true);
        let selectedRoom = getSelectedRoom(rooms, roomId);
        socket.emit("create:info", selectedRoom);
      } else {
        logger.custLog(`[create:room] 잘못된 요청입니다. 생성 아이디의 값이 "create"가 아닙니다.`);
        socket.emit("create:room", false);
      }
    } catch (e) {
      logger.error(`[create:room]에러가 발생했습니다. 원인은 다음과 같습니다.`);
      dataLogger.error(e);
      socket.emit("create:room", false);
    }

  });

  /* 방에 만들 경우 */
  socket.on('join:room', (data) => {
    logger.custLog('[join:room] 요청을 전송받았습니다. ', data);
    try {
      logger.custLog('[join:room] 데이터를 확인합니다. 유저세션 값입니다.', data, usersession);
      leaveAllRoom(socket);

      let selectedRoom = getSelectedRoom(rooms, data.id);

      let socketSession = usersession || {};
      let userinfo = socketSession.userinfo || {};

      if (selectedRoom.hasOwnProperty("id") && isJoinable(selectedRoom, usersession.userinfo.nickname)) {
        logger.custLog('[join:room] 방 입장이 가능하여 입장되었습니다.');
        selectedRoom.members.push(usersession.userinfo.nickname);

        socket.join(data.id);
        socket.userRooms.push(data.id);
        userinfo.room = data.id;

        setNameTag(socket, usersession.userinfo.nickname);
        selectedRoom.currentUsers.push({ nickname: usersession.userinfo.nickname, socketId: socket.id, ready: false });
        socket.broadcast.to(data.id).emit('user:join', usersession.userinfo.nickname);
        socket.emit("join:room", selectedRoom);

      }

    } catch (error) {
      logger.custLog("[ERROR] join:room.", error);
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
    logger.custLog("[send:message] => ",data);
    try {
      data.nickname = usersession.userinfo.nickname;
      ChatSocketIO.to(socket.userRooms[0]).emit('user:message', data);
    } catch (error) {
      logger.custLog("[ERROR][send:message] => ", error);
    }
  });

  /* 방을 떠납니다. */
  socket.on("leave:room", (data) => {
    logger.custLog("[leave:room]", data);
    try {
      const roomId = socket.userRooms[0];
      const userNickname = usersession.userinfo.nickname;
      let selectedRoom = getSelectedRoom(rooms, roomId);
      selectedRoom.members.splice(selectedRoom.members.indexOf(userNickname), 1);
      leaveAllRoom(socket);
      ChatSocketIO.to(roomId).emit("user:exit", userNickname);

      /* 추후 삭제 */
      logger.custLog("[leave:room] 현재 방의 정보들", rooms);
      socket.emit("leave:room", true);

      if(selectedRoom.readiedPlayer.indexOf(userNickname) > -1) {
        selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userNickname), 1);
        selectedRoom.ready--;
      }

      selectedRoom.currentUsers.forEach((memberData, index) => {
        if (memberData.nickname === userNickname) {
          selectedRoom.currentUsers.splice(index, 1);
        }
      });

      if (selectedRoom.members.length === 0) {
        logger.custLog("[leave:room] 방에 아무도 없어 방을 삭제합니다.", rooms[data.number]);
        rooms.splice(rooms.indexOf(selectedRoom), 1);
      } else if (selectedRoom.host === userNickname) {
        logger.custLog("[leave:room] 방장이 방을 나가 새로운 방장을 임명합니다.", selectedRoom);
        selectedRoom.host = selectedRoom.members[0];
        ChatSocketIO.to(roomId).emit("host:change", selectedRoom.host);
      }
    } catch (error) {
      logger.custLog("[ERROR][leave:room] => ", error);
      socket.emit("leave:room", false);
    }
  });

  function leaveAllRoom(socket) {
    const currentRooms = socket.userRooms;
    usersession.userinfo.ready = false;
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
   * 게임 시작 관련 : 레디 / 시작 / 종료
   * */

  socket.on("ready:user", () => {
    logger.custLog("[ready:user] 유저의 준비 요청.");
    const userinfo = usersession.userinfo;
    const userRoom = socket.userRooms[0];
    let selectedRoom = getSelectedRoom(rooms, userRoom);
    if (userinfo.ready) {
      logger.custLog("[ready:user] 유저의 준비되지 않은 유저", usersession);
      userinfo.ready = false;
      selectedRoom.ready--;
      if (selectedRoom.readiedPlayer.indexOf(userinfo.nickname) > -1) {
        selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userinfo.nickname), 1);
      }
      ChatSocketIO.to(socket.userRooms[0]).emit('ready:user', userinfo);
      ChatSocketIO.to(socket.userRooms[0]).emit("all:ready", false);
    } else {
      logger.custLog("[ready:user] 유저의 준비된 유저", usersession);
      userinfo.ready = true;
      selectedRoom.readiedPlayer.push(userinfo.nickname);
      selectedRoom.ready++;
      ChatSocketIO.to(socket.userRooms[0]).emit('ready:user', userinfo);
      selectedRoom.ready >= 2 && selectedRoom.ready === selectedRoom.members.length && ChatSocketIO.to(socket.userRooms[0]).emit("all:ready", true);
    }
  });

  socket.on("start:game", () => {
    logger.custLog("[start:game] 방장의 시작 요청.");
    const userinfo = usersession.userinfo;
    const userRoom = socket.userRooms[0];
    let selectedRoom = getSelectedRoom(rooms, userRoom);
    selectedRoom.playingMembers = deepCopy(selectedRoom.members);
    selectedRoom.ballotBox = selectedRoom.ballotBox.filter((member) => (member));
    logger.custLog("[start:game] 시작하려는 방 정보: ", selectedRoom);
    logger.custLog("[start:game] 시작하려는 방 구성인원: ", selectedRoom.playingMembers);
    selectedRoom.status = "playing";
    /* 거짓말쟁이 추출 */
    const playersLength = selectedRoom.playingMembers.length;
    const liar = selectedRoom.playingMembers[Math.floor(Math.random() * playersLength)];
    /* 첫 시작 플레이어 추출 */
    const targetNumber = Math.floor(Math.random() * playersLength);
    const firstOrder = selectedRoom.playingMembers[targetNumber];
    selectedRoom.playingMembers.splice(targetNumber, 1);
    /* 제시어 선택 */
    redis.smembers(selectedRoom.subject, (error, suggests) => {
      const targetFood = Math.floor(Math.random() * suggests.length);
      const selectedFood = suggests[targetFood];
      selectedRoom.gameRole = selectedFood;
      selectedRoom.currentUsers.forEach(memberData => {
        logger.custLog("[start:game] 판별: ", memberData);
        if (memberData.nickname === liar) {
          logger.custLog("[start:game] 거짓말쟁이: ", memberData);
          memberData.role = 'liar';
          const serviceData = { firstPlayer: firstOrder, role: "거짓말쟁이" };
          ChatSocketIO.to(memberData.socketId).emit("role:game", serviceData);
        } else {
          logger.custLog("[start:game] 제시어를 받은 사람: ", memberData);
          memberData.role = 'innocent';
          const serviceData = { firstPlayer: firstOrder, role: selectedFood };
          ChatSocketIO.to(memberData.socketId).emit("role:game", serviceData);
        }
      });
    });
  });

  socket.on("explain:game", (data) => {
    logger.custLog("[explain:game] 게임 설명을 마치고 다음 사람에게 설명 차례라는 내용을 전달해주어야 합니다.", data);
    try {
      const userRoom = socket.userRooms[0];
      let selectedRoom = getSelectedRoom(rooms, userRoom);
      logger.custLog("[explain:game] 현재 남은 설명할 사람: ", selectedRoom.playingMembers);
      const playersLength = selectedRoom.playingMembers.length;
      const targetNumber = Math.floor(Math.random() * playersLength);
      const nextOrder = selectedRoom.playingMembers[targetNumber];
      selectedRoom.playingMembers.splice(targetNumber, 1);

      if (data.hasOwnProperty("explain")) {
        if (playersLength > 0) {
          const serviceData = { nextPlayer: nextOrder, explain : data.explain, explaingPlayer: data.explaingPlayer };
          logger.custLog("[explain:game] 전달할 데이터", serviceData);
          ChatSocketIO.to(socket.userRooms[0]).emit("explain:game", serviceData);
        } else {
          logger.custLog("[explain:game] 설명할 사람이 남지 않았습니다. 난상토론으로 넘어갑니다.");
          ChatSocketIO.to(socket.userRooms[0]).emit("discuss:game", { explain: data.explain, explaingPlayer: data.explaingPlayer });
        }
      } else {
        logger.custLog("[explain:game] None data exception: 전달할 메세지가 들어오지 않았습니다.", data);
      }


    } catch (e) {
      logger.custLog(`[explain:game]${e}`);
    }
  });

  /* 토론의 종료 */
  socket.on('end:discuss', (data) => {
    logger.custLog("[end:discuss] 토론 종료", data);
    const selectedRoom = getSelectedRoom(rooms, socket.userRooms[0]);
    if (!selectedRoom.discussEnd) {
      selectedRoom.discussEnd = true;
      logger.custLog('투표자들', selectedRoom.currentUsers.map(userinfo => userinfo.nickname));
      ChatSocketIO.to(socket.userRooms[0]).emit("vote:list", selectedRoom.currentUsers.map(userinfo => userinfo.nickname));
    }
  });

  socket.on('vote:game', (data) => {
    logger.custLog('[vote:gmae] 투표한 사람에 대한 데이터: ', data);
    const selectedRoom = getSelectedRoom(rooms, socket.userRooms[0]);

    selectedRoom.ballotBox = selectedRoom.ballotBox.filter((member) => (member));
    selectedRoom.ballotBox.push(data.liarID);
    selectedRoom.senderID.push(data.senderID);

    ChatSocketIO.to(socket.userRooms[0]).emit("vote:senderID", data.senderID);
    if (selectedRoom.ballotBox.length === selectedRoom.currentUsers.length) {
      const result = {
        liar: selectedRoom.currentUsers.filter((member) => member.role === 'liar')[0].nickname,
        result: selectedRoom.ballotBox
      };
      logger.custLog('보낼 결과물: ', result);
      ChatSocketIO.to(socket.userRooms[0]).emit("vote:game", result);
    }
  });

  socket.on('last:chance', () => {
    logger.custLog('[last:chance]거짓말쟁이가 검거되었습니다. 최후의 제시어 확인 발표를 진행합니다.');
    const selectRoom = getSelectedRoom(rooms, socket.userRooms[0]);
    const subject = selectRoom.gameRole;

    redis.smembers(selectRoom.subject, (error, suggests) => {
      const originalDatasLength = suggests.length;
      if (originalDatasLength > 25) {
        suggests.splice(suggests.indexOf(subject), 1);
      }
      const resultLength = suggests.length >= 25 ? 25 : suggests.length;
      for (let index = 0; index < resultLength; index++) {
        const target = Math.floor(Math.random() * suggests.length);
        const temp = suggests[target];
        suggests.splice(target, 1);
        suggests.splice(0, 0, temp);
      }

      let result = [];
      if (originalDatasLength > 25) {
        result = suggests.slice(0, resultLength - 1);
        const collectTarget = Math.floor(Math.random() * result.length);
        result.splice(collectTarget, 0, subject);
      } else {
        result = suggests;
      }

      ChatSocketIO.to(socket.userRooms[0]).emit("last:chance", result);
    });
  });

  socket.on('last:answer', (word) => {
    logger.custLog('[last:answer]거짓말쟁이가 검거되었습니다. 최후의 제시어 확인 발표를 진행합니다.');
    const selectRoom = getSelectedRoom(rooms, socket.userRooms[0]);
    if (selectRoom.gameRole === word) {
      logger.custLog('거짓말쟁이가 제시어를 맞췄습니다!');
      ChatSocketIO.to(socket.userRooms[0]).emit("last:answer", true);
    } else {
      logger.custLog('거짓말쟁이가 제시어를 틀렸습니다!');
      ChatSocketIO.to(socket.userRooms[0]).emit("last:answer", false);
    }
  });

  socket.on('end:game', (data) => {
    // 참여하고 있는 방
    logger.custLog('경기 종료, 초기화를 진행합니다.');
    const selectedRoom = getSelectedRoom(rooms, socket.userRooms[0]);
    if( selectedRoom.ready === 0 ) {

    } else {
      selectedRoom.status = 'wait';
      selectedRoom.ready = 0;
      selectedRoom.ballotBox = [];
      selectedRoom.discussEnd = false;
      selectedRoom.readiedPlayer = [];
      selectedRoom.senderID = [];
    }

    // 개별 유저
    const userinfo = usersession.userinfo;
    userinfo.ready = false;
  });

  socket.on('disconnect', () => {
    logger.custLog("[disconnect] 유저의 연결이 끊어졌습니다.");

    try {
      /* 유저가 들어간 방 찾기 */
      const roomId = usersession.userinfo.room;
      const userNickname = usersession.userinfo.nickname;
      ChatSocketIO.to(roomId).emit("user:exit", userNickname);
      logger.custLog('나간 사람: ', usersession.userinfo);
      logger.custLog('유저의 로그 데이터: ', roomId, userNickname);
      let selectedRoom = getSelectedRoom(rooms, roomId);
      logger.custLog("[disconnect] 선택된 방의 정보: ", selectedRoom);
      selectedRoom.members.splice(selectedRoom.members.indexOf(userNickname), 1);
      leaveAllRoom(socket);

      if (selectedRoom.readiedPlayer.indexOf(userNickname) > -1) {
        selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userNickname), 1);
        selectedRoom.ready--;
      }

      selectedRoom.currentUsers.forEach((memberData, index) => {
        if (memberData.nickname === userNickname) {
          selectedRoom.currentUsers.splice(index, 1);
        }
      });

      if (selectedRoom.members.length === 0) {
        logger.custLog("[disconnect] 방에 아무도 없어 방을 삭제합니다.", selectedRoom);
        rooms.splice(rooms.indexOf(selectedRoom), 1);
      } else if (selectedRoom.host === userNickname) {
        logger.custLog("[leave:room] 방장이 방을 나가 새로운 방장을 임명합니다.", selectedRoom);
        selectedRoom.host = selectedRoom.members[0];
        ChatSocketIO.to(roomId).emit("host:change", selectedRoom.host);
      }

      logger.custLog("[disconnect] 현재 방의 정보들", rooms);
    } catch (error) {
      logger.custLog("[ERROR][disconnect] => ", error);
    }
  });


  socket.emit("rooms:info", filterRooms(rooms));
});

/* 서버 기동 포트: 30500 */
server.listen(30500, () => {
  logger.custLog("SystemLiar All green. Listening on PORT: 30500, 201811101707");
});

function setUserInfoToSession(request, datas) {
  let session = request.session;
  session.id = datas.id;
  session.nickname = datas.nickname;
  return session;
}

function filterRooms(rooms) {
  return rooms.map(room => {
    return {
      id: room.id,
      number: room.number,
      name: room.name,
      subject: room.subject,
      members: room.members,
      limit: room.limit,
      ready: room.ready,
      status: room.status
    }
  })
}

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * 선택된 방을 찾음
 * */
function getSelectedRoom(rooms, id) {
  const checkRoom = rooms.filter(element => {
    return element.id + '' === id + '';
  });
  let selectedRoom = {};
  if (checkRoom.length) {
    selectedRoom = checkRoom[0];
  }
  return selectedRoom;
}
