const { logger, dataLogger } = require('./utilities/logger/winston');

module.exports = (ChatRoom) => {
  ChatRoom.on('connection', socket => {
    logger.custLog(`사용자가 접속하였습니다. 해당 사용자의 아이디는 ${socket.id} 입니다. 소켓 접속에 사용자의 세션 정보를 불러옵니다.`, usersession);

  });
};
