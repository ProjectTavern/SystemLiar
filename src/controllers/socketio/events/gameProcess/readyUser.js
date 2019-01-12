const getSelectedRoom = require('../../modules/getSelectedRoom');
const rooms = require('../../rooms');

/**
 * 유저의 준비 상태를 저장하고, 클라이언트에 전달한다.
 * 신호가 오면 on / off 의 형태처럼 수정한다.
 * @function
 * @return {boolean}
 * @return {Object} userInfo
 * */
module.exports = function() {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;
  let selectedRoom = getSelectedRoom(rooms, roomId);

  if (userInfo.ready) {
    userInfo.ready = false;
    selectedRoom.ready--;
    if (selectedRoom.readiedPlayer.indexOf(userInfo.nickname) > -1) {
      selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userInfo.nickname), 1);
    }
    ChatSocketIO.to(roomId).emit('all:ready', false);
  } else {
    userInfo.ready = true;
    selectedRoom.readiedPlayer.push(userInfo.nickname);
    selectedRoom.ready++;
    if (selectedRoom.ready >= 2 && selectedRoom.ready === selectedRoom.members.filter(member => member).length) {
      ChatSocketIO.to(roomId).emit('all:ready', true);
    }
  }
  ChatSocketIO.to(roomId).emit('ready:user', userInfo);
};
