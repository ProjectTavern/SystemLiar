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

function filterRooms(rooms) {
  return rooms.map(room => {
    return {
      id: room.id,
      number: room.number,
      name: room.name,
      subject: room.subject,
      members: room.members,
      limit: room.limit,
      ready: room.ready,
      status: room.status
    }
  })
}

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * 선택된 방을 찾음
 * */
function getSelectedRoom(rooms, id) {
  const checkRoom = rooms.filter(element => {
    return element.id + '' === id + '';
  });
  let selectedRoom = {};
  if (checkRoom.length) {
    selectedRoom = checkRoom[0];
  }
  return selectedRoom;
}
