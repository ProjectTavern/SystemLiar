const getSelectedRoom = require('./modules/getSelectedRoom');
const filterRooms = require('./modules/filterRooms');


const rooms = require('./rooms');

module.exports = function bindEventChatSocket(ChatSocketIO) {
  ChatSocketIO.on('connection', socket => {
    const socketSet = { socket: socket, ChatSocketIO: ChatSocketIO };

    // 로그인
    const userStatus = require('./events/userInformation/userStatus');
    socket.on('user:status', userStatus.bind(socketSet));
    const userCreateNickname = require('./events/userInformation/userCreateNickname');
    socket.on('user:create:nickname', userCreateNickname.bind(socketSet));

    // 게임방
    socket.emit('rooms:info', filterRooms(rooms));
    const roomsRefresh = require('./events/roomProcess/refreshRoom');
    socket.on('rooms:refresh', roomsRefresh.bind(socketSet));
    const createRoom = require('./events/roomProcess/createRoom');
    socket.on('create:room', createRoom.bind(socketSet));
    const joinRoom = require('./events/roomProcess/joinRoom');
    socket.on('join:room', joinRoom.bind(socketSet));
    const getSubject = require('./events/roomProcess/getSubject');
    socket.on('get:subject', getSubject.bind(socketSet));
    const leaveRoom = require('./events/roomProcess/leaveRoom');
    socket.on('leave:room', leaveRoom.bind(socketSet));

    // 인게임
    const sendMessage = require('./events/gameProcess/sendMessage');
    socket.on('send:message', sendMessage.bind(socketSet));
    const readyUser = require('./events/gameProcess/readyUser');
    socket.on('ready:user', readyUser.bind(socketSet));
    const startGame = require('./events/gameProcess/startGame');
    socket.on('start:game', startGame.bind(socketSet));
    const explainGame = require('./events/gameProcess/explainGame');
    socket.on('explain:game', explainGame.bind(socketSet));
    const endDiscuss = require('./events/gameProcess/endDiscuss');
    socket.on('end:discuss', endDiscuss.bind(socketSet));
    const voteGame = require('./events/gameProcess/voteGame');
    socket.on('vote:game', voteGame.bind(socketSet));
    const lastChance = require('./events/gameProcess/lastChance');
    socket.on('last:chance', lastChance.bind(socketSet));
    const lastAnswer = require('./events/gameProcess/lastAnswer');
    socket.on('last:answer', lastAnswer.bind(socketSet));
    const endGame = require('./events/gameProcess/endGame');
    socket.on('end:game', endGame.bind(socketSet));
    const disconnect = require('./events/userInformation/disconnect');
    socket.on('disconnect', disconnect.bind(socket));
  });
};
