module.exports = function filterRooms(rooms) {
  return rooms.map(room => {
    return {
      id: room.id,
      number: room.number,
      name: room.name,
      subject: room.subject,
      members: room.members,
      limit: room.limit,
      ready: room.ready,
      status: room.status
    }
  })
};
