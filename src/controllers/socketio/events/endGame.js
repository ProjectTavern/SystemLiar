const getSelectedRoom = require('../modules/getSelectedRoom');

let rooms = require('../rooms');
module.exports = function endGame() {
  const socket = this;
  const selectedRoom = getSelectedRoom(rooms, socket.userRooms[0]);
  if( selectedRoom.ready === 0 ) {

  } else {
    selectedRoom.status = 'wait';
    selectedRoom.ready = 0;
    selectedRoom.ballotBox = [];
    selectedRoom.discussEnd = false;
    selectedRoom.readiedPlayer = [];
    selectedRoom.senderID = [];
  }

  // 개별 유저
  const userinfo = usersession.userinfo;
  userinfo.ready = false;
};
