const path = require('path');
var express = require('express');
var router = express.Router();

router.use('/', function timeLog(req, res, next) {
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

module.exports = router;
