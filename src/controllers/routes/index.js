const path = require('path');
const express = require('express');
const router = express.Router();
const redis = require('../../controllers/database/redis');
const {logger} = require('../../utilities/logger/winston');
const HandleBars = require('handlebars');
const suggestManagerTemplate = require('../../resources/templates/SuggestManager.hbs');

HandleBars.registerHelper("checkList", function(options) {
  if (options.hash.index % 5 === options.hash.count) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

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

router.get('/Suggest/CSS/suggestManager.css', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/CSS/suggestManager.css'));
});

router.get('/Suggest/Javascript/suggestManager.js', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/Javascript/suggestManager.js'));
});

router.get('/Test/Chat', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/sample_chat.html'));
});

router.get('/Suggest/Manager', (request, response) => {

  let results = { documents: [] };
  const getSubjects = new Promise((resolve) => {
    redis.smembers('subject', (error, subjects) => {
      resolve(subjects);
    })
  });
  const getSuggests = new Promise((resolve) => {
    getSubjects
      .then((subjects) => {
        subjects.sort();
        subjects.length ?
        subjects.forEach((subject, index) => {
          redis.smembers(subject, (error, suggests) => {
            const subjectDatas = {
              subject: subject,
              suggests: suggests.sort()
            };
            results['documents'].push(subjectDatas);
            if (index === (subjects.length - 1)) {
              resolve(results);
            }
          });
        }) : resolve();
      });
  });

  getSuggests.then((suggestDatas) => {
    response.send(suggestManagerTemplate(suggestDatas));
  });

});

router.post('/Suggest/Manager/Add/Subject', (request, response) => {
  const subject = request.body.subject;
  redis.sadd('subject', subject);
  response.redirect('/Suggest/Manager');
});

router.post('/Suggest/Manager/Add/Suggest', (request, response) => {
  const subject = request.body.subject;
  const suggest = request.body.suggest;
  redis.multi()
    .sadd('subject', subject)
    .sadd(subject, suggest)
    .exec((error, result) => response.redirect('/Suggest/Manager'));
});

router.post('/Suggest/Manager/Remove/Suggest', (request, response) => {
  const subject = request.body.subject;
  const suggest = request.body.suggest;
  redis.multi()
    .srem(subject, suggest)
    .exec((error, result) => response.redirect('/Suggest/Manager'));
});

router.get('/Log/Today', (request, response) => {
  console.log((new Date).currentDay());
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
