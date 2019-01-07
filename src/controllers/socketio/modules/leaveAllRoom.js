module.exports = function leaveAllRoom(socket) {
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;
  socket.leave(roomId);
  userInfo.room = '#0undefined';
  userSession.userinfo.ready = false;
};
