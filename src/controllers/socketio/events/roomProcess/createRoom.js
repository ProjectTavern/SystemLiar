const setNameTag = require('../../modules/setNameTag');
const getSelectedRoom = require('../../modules/getSelectedRoom');

let rooms = require('../../rooms');

module.exports = function createRoom(responseData) {
  const { socket } = this;
  const userSession = socket.handshake.session;

  try{
    if (responseData.id === "create") {

      let roomNumbers = [];
      let possibleLowestRoomNumber = rooms.length + 1;
      rooms.forEach((room) => roomNumbers.push(room.number));
      roomNumbers.sort();
      roomNumbers.forEach((number, index) => {
        if (number !== index + 1) {
          possibleLowestRoomNumber = index + 1;
          return false;
        }
      });

      const roomId = Date.now();
      const userNickname = userSession.userinfo.nickname;
      const roomData = {
        id : roomId,
        number: possibleLowestRoomNumber,
        name : responseData.name,
        subject : responseData.subject,
        members : [userNickname],
        limit : 7,
        status : "대기중",
        ready: 0,
        readiedPlayer: [],
        host: userNickname,
        currentUsers: [{ nickname: userNickname, socketId: socket.id, ready: false }],
        ballotBox: [],
        senderID: []
      };
      rooms.push(roomData);
      /* 합쳐야할지 고민 */
      socket.join(roomId);
      let userInfo = userSession.userinfo;
      userInfo.room = roomId;

      setNameTag(socket, userNickname);
      socket.emit("create:room", true);
      const selectedRoom = getSelectedRoom(rooms, roomId);
      socket.emit("create:info", selectedRoom);
    } else {
      socket.emit("create:room", false);
    }
  } catch (e) {
    socket.emit("create:room", false);
  }
};
