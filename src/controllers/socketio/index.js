const getSelectedRoom = require('./modules/getSelectedRoom');
const filterRooms = require('./modules/filterRooms');


const rooms = require('./rooms');

module.exports = function bindEventChatSocket(ChatSocketIO) {
  ChatSocketIO.on('connection', socket => {
    socket.userRooms = [];
    const usersession = socket.handshake.session;

    const SocketSet = { socket: socket, ChatSocketIO: ChatSocketIO };

    // 로그인
    const userStatus = require('./events/userInformation/userStatus');
    socket.on('user:status', userStatus.bind(socket));
    const userCreateNickname = require('./events/userInformation/userCreateNickname');
    socket.on('user:create:nickname', userCreateNickname.bind(socket));

    // 게임방
    socket.emit('rooms:info', filterRooms(rooms));
    const roomsRefresh = require('./events/roomProcess/refreshRoom');
    socket.on('rooms:refresh', roomsRefresh.bind(socket));
    const createRoom = require('./events/roomProcess/createRoom');
    socket.on('create:room', createRoom.bind(socket));
    const joinRoom = require('./events/roomProcess/joinRoom');
    socket.on('join:room', joinRoom.bind(socket));
    const getSubject = require('./events/roomProcess/getSubject');
    socket.on('get:subject', getSubject.bind(socket));
    const leaveRoom = require('./events/roomProcess/leaveRoom');
    socket.on('leave:room', leaveRoom.bind(socket));

    // 인게임
    const sendMessage = require('./events/gameProcess/sendMessage');
    socket.on('send:message', sendMessage.bind(SocketSet));
    const readyUser = require('./events/gameProcess/readyUser');
    socket.on('ready:user', readyUser.bind(socket));

    socket.on('start:game', () => {
      const userinfo = usersession.userinfo;
      const userRoom = socket.userRooms[0];
      let selectedRoom = getSelectedRoom(rooms, userRoom);
      selectedRoom.playingMembers = deepCopy(selectedRoom.members);
      selectedRoom.ballotBox = selectedRoom.ballotBox.filter((member) => (member));
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
          if (memberData.nickname === liar) {
            memberData.role = 'liar';
            const serviceData = { firstPlayer: firstOrder, role: "거짓말쟁이" };
            ChatSocketIO.to(memberData.socketId).emit("role:game", serviceData);
          } else {
            memberData.role = 'innocent';
            const serviceData = { firstPlayer: firstOrder, role: selectedFood };
            ChatSocketIO.to(memberData.socketId).emit("role:game", serviceData);
          }
        });
      });
    });

    socket.on('explain:game', (data) => {
      try {
        const userRoom = socket.userRooms[0];
        let selectedRoom = getSelectedRoom(rooms, userRoom);
        const playersLength = selectedRoom.playingMembers.length;
        const targetNumber = Math.floor(Math.random() * playersLength);
        const nextOrder = selectedRoom.playingMembers[targetNumber];
        selectedRoom.playingMembers.splice(targetNumber, 1);

        if (data.hasOwnProperty("explain")) {
          if (playersLength > 0) {
            const serviceData = { nextPlayer: nextOrder, explain : data.explain, explaingPlayer: data.explaingPlayer };
            ChatSocketIO.to(socket.userRooms[0]).emit("explain:game", serviceData);
          } else {
            ChatSocketIO.to(socket.userRooms[0]).emit("discuss:game", { explain: data.explain, explaingPlayer: data.explaingPlayer });
          }
        } else {
        }


      } catch (e) {
      }
    });

    socket.on('end:discuss', (data) => {
      const selectedRoom = getSelectedRoom(rooms, socket.userRooms[0]);
      if (!selectedRoom.discussEnd) {
        selectedRoom.discussEnd = true;
        ChatSocketIO.to(socket.userRooms[0]).emit("vote:list", selectedRoom.currentUsers.map(userinfo => userinfo.nickname));
      }
    });

    socket.on('vote:game', (data) => {
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
        ChatSocketIO.to(socket.userRooms[0]).emit("vote:game", result);
      }
    });

    socket.on('last:chance', () => {
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
      const selectRoom = getSelectedRoom(rooms, socket.userRooms[0]);
      if (selectRoom.gameRole === word) {
        ChatSocketIO.to(socket.userRooms[0]).emit("last:answer", true);
      } else {
        ChatSocketIO.to(socket.userRooms[0]).emit("last:answer", false);
      }
    });

    const endGame = require('./events/gameProcess/endGame');
    socket.on('end:game', endGame.bind(socket));
    const disconnect = require('./events/userInformation/disconnect');
    socket.on('disconnect', disconnect.bind(socket));
  });
};

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
}
