/**
 * 레디스 기본 설정 및 세팅
 * */
const redis = require('redis');
const client = redis.createClient();

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

const config = {
  "ranking-board" : "ranking-board"
};

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
client.zadd(config["ranking-board"], 100, JSON.stringify(testUserId1));
client.zadd(config["ranking-board"], 200, JSON.stringify(testUserId2));
client.zadd(config["ranking-board"], 300, JSON.stringify(testUserId3));

/**
 * 추가적으로 얻은 성적 데이터는 zincrby를 활용하여 값을 더해줌
 * */
client.zincrby(config["ranking-board"], 100, JSON.stringify(testUserId1));

/* 랭킹 데이터 출력 */
client.zrevrange(config["ranking-board"], 0, 2, (err, obj) => {
  console.log(obj);
  const rankingData = obj.map(elem => JSON.parse(elem).nickname);
  console.log(rankingData);
});
