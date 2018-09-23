/* 설정 정보 불러오기 */
const CONFIG = require("./config");

/* 레디스 기본 설정 및 세팅 */
const Redis = require('ioredis');
module.exports = new Redis(CONFIG.SERVER);
