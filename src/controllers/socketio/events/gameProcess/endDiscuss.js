const getSelectedRoom = require('../../modules/getSelectedRoom');

const rooms = require('../../rooms');
module.exports = function endDiscuss() {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;

  const selectedRoom = getSelectedRoom(rooms, roomId);
  if (!selectedRoom.discussEnd) {
    selectedRoom.discussEnd = true;
    ChatSocketIO.to(roomId).emit("vote:list", selectedRoom.currentUsers.map(userinfo => userinfo.nickname));
  }
};
