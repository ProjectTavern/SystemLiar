const app = require('express')();
const server = require('http').createServer(app);
const pages = require('./controllers/routes/index');
const configure = require('./config/main.config');
const io = require('socket.io')(server);
const socketSession = require('express-socket.io-session');
const ChatSocketIOEvent = require('./controllers/socketio/index');
const serverPort = 80;

configure(app);
app.use('/', pages);

// 임시 프로토타입 세팅
Array.prototype.findEmptyPositions = function(nickname) {
  const _this = this;
  _this.some((elem, index) => {
    if (!elem) return _this[index] = nickname;
  });
  return _this;
};
Array.prototype.findNextHost = function() {
  const _this = this;
  let nextHost = '';
  _this.some((elem, index) => {
    if (elem) return nextHost = elem;
  });
  return nextHost;
};

const ChatSocketIO = io.of('/roomspace');
ChatSocketIO.use(socketSession(app.session, { autoSave: true }));
ChatSocketIOEvent(ChatSocketIO);

server.listen(serverPort);
