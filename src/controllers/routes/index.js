const path = require('path');

module.exports = (app) => {
  const express = require('express');
  const router = express.Router();
  console.log(path.join(__dirname, '../../resources/templates/index.html'));

  router.get('/', function(request, response) {
    console.log('request');
    response.sendFile(path.join(__dirname, '../../resources/templates/index.html'));
  });

  /* 레디스 테스트 페이지 */
  router.get('/redis', function(request, response) {
    response.sendFile(path.join(__dirname, '/resources/templates/sample_redis.html'));
  });

  /* 채팅 테스트 페이지 */
  router.get('/chat', function(request, response) {
    response.sendFile(path.join(__dirname, '/resources/templates/sample_chat.html'));
  });

  router.get('/get/chat', function(request, response) {
    response.json({ name: "Kintergod" });
  });

  return router;
};
