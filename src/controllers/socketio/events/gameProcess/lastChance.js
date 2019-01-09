const getSelectedRoom = require('../../modules/getSelectedRoom');
const redis = require('../../../database/redis');
const rooms = require('../../rooms');

/**
 * 거짓말쟁이에게 마지막 기회로 제시어를 맞출 수 있게 해준다.
 * @function
 * @return {Array} result
 * */
module.exports = function lastChance() {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;

  const selectRoom = getSelectedRoom(rooms, roomId);
  const subject = selectRoom.gameRole;

  redis.smembers(selectRoom.subject, (error, suggests) => {
    const originalDatasLength = suggests.length;
    if (originalDatasLength > 25) {
      suggests.splice(suggests.indexOf(subject), 1);
    }
    const resultLength = suggests.length >= 25 ? 25 : suggests.length;
    for (let index = 0; index < resultLength; index++) {
      const target = Math.floor(Math.random() * suggests.length);
      const temp = suggests[target];
      suggests.splice(target, 1);
      suggests.splice(0, 0, temp);
    }

    let result = [];
    if (originalDatasLength > 25) {
      result = suggests.slice(0, resultLength - 1);
      const collectTarget = Math.floor(Math.random() * result.length);
      result.splice(collectTarget, 0, subject);
    } else {
      result = suggests;
    }

    ChatSocketIO.to(roomId).emit("last:chance", result);
  });
};
