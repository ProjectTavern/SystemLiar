let rooms = [];

const iddata = Date.now();
let roomMock1 = {
  id : iddata + 1,
  name : "아무 일도 없었다.",
  subject: "음식",
  members : ["삼다수", "백두무궁", "한라삼천"],
  limit : 7,
  status : "wait",
  ready: 0
};
let roomMock2 = {
  id : iddata + 2,
  name : "방 리스트 테스트",
  subject: "직업",
  members : ["카카로트", "베지터", "부르마"],
  limit : 7,
  status : "playing",
  ready: 3
};
let roomMock3 = {
  id : iddata + 3,
  name : "종료된 방",
  subject : "장소",
  members : ["드레이크", "네로", "아르토리아", "에미야"],
  limit : 7,
  status : "end",
  ready: 6
};
let roomMock4 = {
  id : iddata + 4,
  name : "시작하지 않은 방",
  subject : "음식",
  members : ["창세기전", "에픽세븐", "페이트그랜드오더", "슈퍼로봇대전", "게타", "제이데커", "와룡"],
  limit : 7,
  status : "wait",
  ready: 0
};
let roomMock5 = {
  id : iddata + 5,
  name : "가능 방",
  subject : "장소",
  members : ["드래곤", "와이번", "드레이크"],
  limit : 7,
  status : "wait",
  ready: 3
};

const foods =
  [
    "라면",
    "아이스크림",
    "크림파스타",
    "피자",
    "햄버거",
    "뿌셔뿌셔",
    "드래곤스테이크",
    "아메리카노"
  ];

rooms.push(roomMock1);
rooms.push(roomMock2);
rooms.push(roomMock3);
rooms.push(roomMock4);
rooms.push(roomMock5);

module.exports = rooms;
