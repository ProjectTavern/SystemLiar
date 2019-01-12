module.exports = function isJoinPossible(selectedRoom, nickname) {
  const isNotJoined = !((selectedRoom.members.filter(element => element === nickname)).length);
  return selectedRoom.status === "대기중"
    && selectedRoom.members.length < selectedRoom.limit
    && isNotJoined;
};
