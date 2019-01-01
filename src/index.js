const app = require('express')();
const server = require('http').createServer(app);
const pages = require('./controllers/routes/index');
const socketsession = require('express-socket.io-session');
const redis = require('./controllers/database/redis');
const io = require('socket.io')(server);
const dataScheme = require('./config/dataset');
const configure = require('./config/main.config');
const { logger, dataLogger } = require('./utilities/logger/winston');
const serverPort = 80;

// 앱 설정
configure(app);
app.use('/', pages);

const ChatSocketIO = io.of('/roomspace');
ChatSocketIO.use(socketsession(app.session, { autoSave: true }));

// 방 => 추후 이동
const ChatSocketIOEvent = require('./controllers/socketio/index');
ChatSocketIOEvent(ChatSocketIO);

server.listen(serverPort, () => {
  logger.custLog('SystemLiar All green.');
});
