/* 유저 상태 확인 */
app.post('/user/status', (request, response, next) => {
  request.accepts('application/json');
  request.on('data', (data) => dataLogger.info(data));

  const userGhash = request.body.id;
  const value = JSON.stringify(request.body);

  logger.info('조회 받은 데이터 정보를 통해 유저의 정보를 데이터베이스에서 가져옵니다.');

  request.redis.hget(userGhash, "nickname", (error, value) => {
    if (value) {
      logger.info('유저 정보가 기존 데이터셋에 존재합니다. 세션에 유저 정보를 저장합니다.');
      /* 세션에 데이터 저장 */
      const datas = { id: userGhash, nickname: value };
      const session = setUserInfoToSession(request, datas);
      response.send(value);
    } else {
      logger.info(`유저 정보가 기존 데이터에 존재하지 않습니다. 생성 요청을 전송합니다.`);
      response.send(false);
    }
  });
});

/**
 * 구글 아이디 + 닉네임 저장
 * 닉네임이 사용되고 있는 것인지 체크 후에 사용 가능하면 바로 저장
 *
 * 사용가능하여 저장된 경우에는 true
 * 사용하고 있는 닉네임이 있는 경우에는 false
 * */
app.post('/user/create/nickname/', (request, response, next) => {
  request.accepts('application/json');
  request.on('data', data => dataLogger.info(data));

  const userData = request.body;
  dataLogger.info(userData);

  /* 유저 정보 배열로 전환 */
  let userInform = [];
  for ( let userInformKey in userData) {
    if (userData.hasOwnProperty(userInformKey)) {
      userInform.push(userInformKey);
      userInform.push(userData[userInformKey]);
    }
  }

  /* 유저 정보 */
  const userNickname = userData.nickname;
  const userGhashId = userData.id;

  request.redis.smembers(configDataset.user.nicknames, (error, userNicknameLists) => {
    if(userNicknameLists.includes(userNickname)) {
      logger.info(`사용하시려는 대화명 ${userNickname}이 이미 존재합니다. 다른 대화명 사용을 요청합니다.`);
      response.send(false);
    } else {
      logger.info(`${userNickname}은 사용할 수 있는 대화명입니다. 데이터 베이스에 저장을 진행합니다.`);
      request.redis
        .multi()
        .sadd(configDataset.user.nicknames, userNickname)
        .hset(userGhashId, userInform)
        .exec((error, result) => {
          if (error) {
            logger.error(`유저의 정보를 저장하려고 시도했으나 실패했습니다. 실패 보고를 전송합니다. 이유는 다음과 같습니다.`);
            dataLogger.error(error);
            response.send(false);
          }
          logger.info('유저의 정보를 성공적으로 저장했습니다. 세션에 유저의 정보를 저장하고 성공 보고를 전송합니다.');
          /* 세션에 데이터 저장 */
          const datas = { id: userGhashId, nickname: userNickname };
          const session = setUserInfoToSession(request, datas);

          response.send(true);
        });
    }
  });
});
