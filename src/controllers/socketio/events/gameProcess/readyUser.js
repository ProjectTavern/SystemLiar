const getSelectedRoom = require('../../modules/getSelectedRoom');

const rooms = require('../../rooms');

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
    if (selectedRoom.ready >= 2 && selectedRoom.ready === selectedRoom.members.length) {
      ChatSocketIO.to(roomId).emit('all:ready', true);
    }
  }
  ChatSocketIO.to(roomId).emit('ready:user', userInfo);
};
