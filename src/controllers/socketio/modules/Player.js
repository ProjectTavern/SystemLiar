class Player {
  constructor(options) {
    this.redis = options.redis;
    this.socket = options.socket;
    this.session = options.session;
  }

  setUserStatus(data) {
    const userGhash = data.id;
    this.redis.hget(userGhash, "nickname", (error, value) => {
      if (value) {
        console.log("[LOG][user:status] 유저 정보가 기존 데이터셋에 존재합니다.", value);
        console.log("[LOG][user:status] 세션에 유저 정보를 저장합니다.");
        this.session.userinfo = { id: userGhash, nickname: value, socketId: socket.id };
        this.socket.emit("user:status", value);
      } else {
        console.log("[LOG][user:status] 유저 정보가 기존 데이터셋에 존재하지 않습니다.", value);
        this.socket.emit("user:status", false);
      }
    });
  }
}
