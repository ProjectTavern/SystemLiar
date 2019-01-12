const filterRooms = require('./modules/filterRooms');
const users = require('../database/Users');
// 개별룸 객체화 필요
const rooms = require('./rooms');

// 로그인
const userStatus = require('./events/userInformation/userStatus');
const userCreateNickname = require('./events/userInformation/userCreateNickname');
// 게임방
const roomsRefresh = require('./events/roomProcess/refreshRoom');
const createRoom = require('./events/roomProcess/createRoom');
const joinRoom = require('./events/roomProcess/joinRoom');
const getSubject = require('./events/roomProcess/getSubject');
const leaveRoom = require('./events/roomProcess/leaveRoom');
// 인게임
const sendMessage = require('./events/gameProcess/sendMessage');
const readyUser = require('./events/gameProcess/readyUser');
const startGame = require('./events/gameProcess/startGame');
const explainGame = require('./events/gameProcess/explainGame');
const endDiscuss = require('./events/gameProcess/endDiscuss');
const voteGame = require('./events/gameProcess/voteGame');
const lastChance = require('./events/gameProcess/lastChance');
const lastAnswer = require('./events/gameProcess/lastAnswer');
const endGame = require('./events/gameProcess/endGame');
// 접속종료
const disconnect = require('./events/userInformation/disconnect');

module.exports = function bindEventChatSocket(ChatSocketIO) {
  ChatSocketIO.on('connection', socket => {
    users.connected();
    const socketSet = { socket: socket, ChatSocketIO: ChatSocketIO };

    // 로그인
    socket.on('user:status', userStatus.bind(socketSet));
    socket.on('user:create:nickname', userCreateNickname.bind(socketSet));

    // 게임방
    socket.emit('rooms:info', filterRooms(rooms));
    socket.on('rooms:refresh', roomsRefresh.bind(socketSet));
    socket.on('create:room', createRoom.bind(socketSet));
    socket.on('join:room', joinRoom.bind(socketSet));
    socket.on('get:subject', getSubject.bind(socketSet));
    socket.on('leave:room', leaveRoom.bind(socketSet));

    // 인게임
    socket.on('send:message', sendMessage.bind(socketSet));
    socket.on('ready:user', readyUser.bind(socketSet));
    socket.on('start:game', startGame.bind(socketSet));
    socket.on('explain:game', explainGame.bind(socketSet));
    socket.on('end:discuss', endDiscuss.bind(socketSet));
    socket.on('vote:game', voteGame.bind(socketSet));
    socket.on('last:chance', lastChance.bind(socketSet));
    socket.on('last:answer', lastAnswer.bind(socketSet));
    socket.on('end:game', endGame.bind(socketSet));

    // 접속종료
    socket.on('disconnect', disconnect.bind(socketSet));
  });
};
