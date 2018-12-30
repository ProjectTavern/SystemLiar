module.exports = function leaveAllRoom(socket) {
  const currentRooms = socket.userRooms;
  const userSession = socket.handshake.session;
  userSession.userinfo.ready = false;
  currentRooms.forEach((elem) => {
    socket.leave(elem);
  });
  socket.userRooms = [];
};
