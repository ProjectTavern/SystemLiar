const setNameTag = require('../modules/setNameTag');
const leaveAllRoom = require('../modules/leaveAllRoom');
const isJoinPossible = require('../modules/isJoinPossible');
const getSelectedRoom = require('../modules/getSelectedRoom');

let rooms = require('../rooms');
module.exports = function joinRoom(responseData) {
  const socket = this;
  const userSession = socket.handshake.session;

  try {

    leaveAllRoom(socket);
    const roomId = responseData.id;
    let selectedRoom = getSelectedRoom(rooms, roomId);
    let userInfo = userSession.userinfo;
    if (selectedRoom.hasOwnProperty("id") && isJoinPossible(selectedRoom, userSession.userinfo.nickname)) {
      const userNickname = userSession.userinfo.nickname;
      setNameTag(socket, userNickname);
      selectedRoom.members.push(userNickname);
      selectedRoom.currentUsers.push({ nickname: userNickname, socketId: socket.id, ready: false });
      userInfo.room = roomId;
      socket.join(roomId);
      socket.userRooms.push(roomId);
      socket.emit("join:room", selectedRoom);
      socket.broadcast.to(roomId).emit('user:join', userNickname);
    }

  } catch (error) {

  }

};
