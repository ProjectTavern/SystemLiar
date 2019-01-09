const getSelectedRoom = require('../../modules/getSelectedRoom');
const rooms = require('../../rooms');

/**
 * 토론을 종료한다.
 * 투표 리스트를 클라이언트에 전달한다.
 * @function
 * @return {Array} emit
 * */
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
