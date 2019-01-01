module.exports = function sendMessage(responseData) {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  try {
    responseData.nickname = userSession.userinfo.nickname;
    const roomId = userSession.userinfo.room;
    ChatSocketIO.to(roomId).emit("user:message", responseData);
  } catch (error) {

  }
};
