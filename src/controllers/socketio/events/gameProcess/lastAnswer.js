const getSelectedRoom = require('../../modules/getSelectedRoom');


const rooms = require('../../rooms');
/**
 * @return undefined
 * @params responseData string
 * */
module.exports = function lastAnswer(responseData) {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;

  const selectRoom = getSelectedRoom(rooms, roomId);
  if (selectRoom.gameRole === responseData) {
    ChatSocketIO.to(roomId).emit("last:answer", true);
  } else {
    ChatSocketIO.to(roomId).emit("last:answer", false);
  }
};
