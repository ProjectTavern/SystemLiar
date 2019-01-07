const getSelectedRoom = require('../../modules/getSelectedRoom');

const rooms = require('../../rooms');

module.exports = function voteGame(responseData) {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;

  const selectedRoom = getSelectedRoom(rooms, roomId);

  selectedRoom.ballotBox = selectedRoom.ballotBox.filter((member) => (member));
  selectedRoom.ballotBox.push(responseData.liarID);
  selectedRoom.senderID.push(responseData.senderID);

  ChatSocketIO.to(roomId).emit("vote:senderID", responseData.senderID);
  if (selectedRoom.ballotBox.length === selectedRoom.currentUsers.length) {
    const result = {
      liar: selectedRoom.currentUsers.filter((member) => member.role === 'liar')[0].nickname,
      result: selectedRoom.ballotBox
    };
    ChatSocketIO.to(roomId).emit("vote:game", result);
  }
};
