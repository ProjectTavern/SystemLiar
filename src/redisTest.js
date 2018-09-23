/**
 * 테스트용 코드 작성
 * */
const client = require('./redis');

const CONFIG = require("./config");
const SYSTEMMESSAGE = CONFIG.SYSTEMMESSAGE;


/**
 * 키 밸류 입력 테스트
 * */
function basicTest() {
  const userTableKey = 'user';
  const mockUserStatus = {
    id : "GOOGLESETUPID@1523#!@@",
    win: 10,
    lose: 5
  };

  client.set(userTableKey, JSON.stringify(mockUserStatus));

  client.get(userTableKey, (err, obj) => {
    if (err) throw new Error(SYSTEMMESSAGE.GETDATAERROR);
    console.log(JSON.parse(obj));
  });
}

/**
 * zset 테스트
 * */
function zsetTest() {
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
  client.zadd(CONFIG["RANKINGBOARD"], 100, JSON.stringify(testUserId1));
  client.zadd(CONFIG["RANKINGBOARD"], 200, JSON.stringify(testUserId2));
  client.zadd(CONFIG["RANKINGBOARD"], 300, JSON.stringify(testUserId3));

  /**
   * 추가적으로 얻은 성적 데이터는 zincrby를 활용하여 값을 더해줌
   * */
  client.zincrby(CONFIG["RANKINGBOARD"], 100, JSON.stringify(testUserId1));

  /* 랭킹 데이터 출력 */
  client.zrevrange(CONFIG["RANKINGBOARD"], 0, 2, (err, obj) => {
    console.log(obj);
    const rankingData = obj.map(elem => JSON.parse(elem).nickname);
    console.log(rankingData);
  });

  /**
   * TODO:
   * 승패 점수 관리
   * 1승
   * 1패
   * 결과에 대해 점수 처리해서 점수 저장
   * 아이디 / 승 / 패 / 점수
   * */
}
