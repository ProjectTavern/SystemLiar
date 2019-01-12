const getSelectedRoom = require('../../modules/getSelectedRoom');

let rooms = require('../../rooms');

/**
 * 게임을 종료한다.
 * 게임을 초기화한다.
 * @function
 * @return {undefined}
 * */
module.exports = function endGame() {
  const { socket } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;

  const selectedRoom = getSelectedRoom(rooms, roomId);
  if( selectedRoom.ready === 0 ) {

  } else {
    selectedRoom.status = '대기중';
    selectedRoom.ready = 0;
    selectedRoom.ballotBox = [];
    selectedRoom.discussEnd = false;
    selectedRoom.readiedPlayer = [];
    selectedRoom.senderID = [];
  }

  userInfo.ready = false;
};
