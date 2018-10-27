const roomspaceRouter = require('./routes');

module.exports = (io) => {
  const roomspace = io.of('/roomspace');
  roomspace.on('connection', (socket) => {
    socket.on('user:create:nickname', roomspaceRouter.userCreateNickname);
    socket.on('user:status', roomspaceRouter.userStatus);
    socket.on('rooms:refresh', roomspaceRouter.roomsRefresh);
    socket.on('join:room', roomspaceRouter.joinRoom);
    socket.on('leave:room', roomspaceRouter.leaveRoom);
    socket.on('ready:user', roomspaceRouter.readyUser);
    socket.on('send:message', roomspaceRouter.sendMessage);
    socket.on('start:game', roomspaceRouter.startGame);
    socket.on('explain:game', roomspaceRouter.explainGame);
    socket.on('end:discuss', roomspaceRouter.endDiscuuss);
    socket.on('disconnect', roomspaceRouter.disconnect);
  });
};


