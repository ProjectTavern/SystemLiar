const socketsession = require('express-socket.io-session');

module.exports = function socket(app, server) {
  const io = require('socket.io')(server);

  const roomspace = io.of('/roomspace');
  roomspace.use(socketsession(app.session, { autoSave: true }));



};
