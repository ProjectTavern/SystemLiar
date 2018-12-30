module.exports = function isJoinPossible(selectedRoom, nickname) {
  const isNotJoined = !((selectedRoom.members.filter(element => element === nickname)).length);
  return selectedRoom.status === "wait"
    && selectedRoom.members.length < selectedRoom.limit
    && isNotJoined;
};
