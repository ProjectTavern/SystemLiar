const getSelectedRoom = require('../../modules/getSelectedRoom');
const rooms = require('../../rooms');

/**
 * 거짓말쟁이 최후의 기회를 준다.
 * 제시어를 맞추면 성공이다.
 * @function
 * @param {String} requestData
 * @return {undefined}
 * */
module.exports = function lastAnswer(requestData) {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;

  const selectRoom = getSelectedRoom(rooms, roomId);
  let responseAnswer = selectRoom.gameRole === requestData;
  ChatSocketIO.to(roomId).emit("last:answer", responseAnswer);
};
