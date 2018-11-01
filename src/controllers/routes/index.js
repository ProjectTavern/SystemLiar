const path = require('path');
const express = require('express');
const router = express.Router();
const redis = require('../../controllers/database/redis');
const { logger } = require('../../utilities/logger/winston');

router.use('/', (request, response, next) => {
  next();
});

router.get('/', (request, response) => {
  response.redirect('/Main');
});

router.get('/Main', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/index.html'));
});

router.get('/Data/Redis', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/sample_redis.html'));
});

router.get('/Test/Chat', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/sample_chat.html'));
});

router.get('/Log/Today', (request, response) => {
  response.sendFile(path.join(__dirname, `../../utilities/logger/log/${(new Date).currentDay()}.log`));
});

router.post('/database/all/reset', (request, response) => {
  redis.flushall()
    .then(value => {
      logger.custLog('데이터 제거 중입니다.', value);
      response.send(true);
    });
});

module.exports = router;
