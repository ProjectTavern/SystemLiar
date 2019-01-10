class Users {
  constructor() {
    this.length = 0;
  }

  connected() {
    this.length++;
  }

  disconnected() {
    this.length--;
  }

  getLength() {
    return this.length;
  }
}

export default new Users();
