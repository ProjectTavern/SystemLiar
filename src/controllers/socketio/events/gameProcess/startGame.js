const getSelectedRoom = require('../../modules/getSelectedRoom');
const deepCopy = require('../../modules/deepCopy');

const rooms = require('../../rooms');

module.exports = function() {
  const { socket, ChatSocketIO } = this;
  const userSession = socket.handshake.session;
  const userInfo = userSession.userinfo;
  const roomId = userInfo.room;
  let selectedRoom = getSelectedRoom(rooms, roomId);
  selectedRoom.playingMembers = deepCopy(selectedRoom.members);
  selectedRoom.ballotBox = selectedRoom.ballotBox.filter((member) => (member));
  selectedRoom.status = 'playing';
  /* 거짓말쟁이 추출 */
  const playersLength = selectedRoom.playingMembers.length;
  const liar = selectedRoom.playingMembers[Math.floor(Math.random() * playersLength)];
  /* 첫 시작 플레이어 추출 */
  const targetNumber = Math.floor(Math.random() * playersLength);
  const firstOrder = selectedRoom.playingMembers[targetNumber];
  selectedRoom.playingMembers.splice(targetNumber, 1);
  /* 제시어 선택 */
  redis.smembers(selectedRoom.subject, (error, suggests) => {
    const targetFood = Math.floor(Math.random() * suggests.length);
    const selectedFood = suggests[targetFood];
    selectedRoom.gameRole = selectedFood;
    selectedRoom.currentUsers.forEach(memberData => {
      if (memberData.nickname === liar) {
        memberData.role = 'liar';
        const serviceData = { firstPlayer: firstOrder, role: "거짓말쟁이" };
        ChatSocketIO.to(memberData.socketId).emit("role:game", serviceData);
      } else {
        memberData.role = 'innocent';
        const serviceData = { firstPlayer: firstOrder, role: selectedFood };
        ChatSocketIO.to(memberData.socketId).emit("role:game", serviceData);
      }
    });
  });
};
