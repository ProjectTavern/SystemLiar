/**
 * 레디스 기본 설정 및 세팅
 * */
const Redis = require('ioredis');
const JSON = require('JSON');

const CONFIG = {
  "SERVER" : {
    port: 6379,
    host: 'localhost',
    password: 'password',
    db: 0
  },
  "rankingBoard" : "rankingBoard"
};

client = new Redis(CONFIG.SERVER);

const SYSTEMMESSAGE = {
  GETDATAERROR: "데이터를 가져올 수 없습니다."
};

/**
 * 테스트용 코드 작성
 * */
client.set('name', 'qoov');
client.get('name', (err, obj) => {
  if (err) throw new Error(SYSTEMMESSAGE.GETDATAERROR);
  console.log(obj);
});

const testUserId1 = {
  "hashID" : "!@adf@ZD@$!!@#",
  "nickname": "Godfather"
};
const testUserId2 = {
  "hashID" : "#@adf@ZD@$!!@#",
  "nickname": "Qoov"
};
const testUserId3 = {
  "hashID" : "!@adf@ZD@$!$@#",
  "nickname": "dnrkckzk"
};

/**
 * 목업데이터를 획득하여 초기 설정값 세팅
 * */
client.zadd(CONFIG["rankingBoard"], 100, JSON.stringify(testUserId1));
client.zadd(CONFIG["rankingBoard"], 200, JSON.stringify(testUserId2));
client.zadd(CONFIG["rankingBoard"], 300, JSON.stringify(testUserId3));

/**
 * 추가적으로 얻은 성적 데이터는 zincrby를 활용하여 값을 더해줌
 * */
client.zincrby(CONFIG["rankingBoard"], 100, JSON.stringify(testUserId1));

/* 랭킹 데이터 출력 */
client.zrevrange(CONFIG["rankingBoard"], 0, 2, (err, obj) => {
  console.log(obj);
  const rankingData = obj.map(elem => JSON.parse(elem).nickname);
  console.log(rankingData);
});
