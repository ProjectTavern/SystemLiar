const path = require('path');
const express = require('express');
const router = express.Router();
const redis = require('../../controllers/database/redis');
const {logger} = require('../../utilities/logger/winston');
const HandleBars = require('handlebars');
const suggestManagerTemplate = require('../../resources/templates/SuggestManager.hbs');
const noticeManagerTemplate = require('../../resources/templates/NoticeManager.hbs');
const shellExec = require('shell-exec');
const axios = require('axios');

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
  response.redirect('/Manager/LogCheck');
});

router.get('/app-ads.txt', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/GoogleCertification/app-ads.txt'));
});

router.get('/usersLength', (request, response) => {
  const users = require('../database/Users');
  response.json({usersLength: users.getLength()});
});

router.get('/Test/Chat', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/sample_chat.html'));
});

router.use('/Manager', (request, response, next) => {
  const isAdminProcess = request.session.isAdmin || request.url === '/LogIn';
  isAdminProcess ? next() : response.sendFile(path.join(__dirname, '../../resources/templates/index.html'));
});

router.get('/Manager/LogCheck', (request, response, next) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/menu.html'));
});

router.post('/Manager/LogIn', (request, response) => {
  const { id, password } = request.body;
  if (id === 'dnrkckzk' && password === 'addnrkminckzk') {
    request.session.isAdmin = true;
  }
  response.redirect('/Manager/LogCheck');
});

router.get('/Data/Redis', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/templates/sample_redis.html'));
});

router.get('/Manager/Suggest/CSS/suggestManager.css', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/CSS/suggestManager.css'));
});

router.get('/Manager/Suggest/Javascript/suggestManager.js', (request, response) => {
  response.sendFile(path.join(__dirname, '../../resources/Javascript/suggestManager.js'));
});



router.get('/Manager/Suggest/Manager', (request, response) => {

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

router.get('/Suggest/Get/liarwordlist', async (request, response) => {
  const requestURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIZMny52zLykWqswYlOuFtWuPOivgdp9SHXATwietk6jmPcI7sdw3px6bSKwWW8npK9QcJLFaKwUs1/pub?output=csv';
  const { data = '' } = await axios.get(requestURL);
  const rows = data.split('\r\n');
  const responseData = { documents: [] };
  rows.forEach((row, rowIndex) => {
    
    if (rowIndex === 1) {
      return false
    }
    
    const columns = row.split(',');
    
    if (rowIndex === 0) {
      columns.forEach(columnSubject => {
        if(!columnSubject) {
          return;
        }
        const columsData = {};
        columsData.subject = columnSubject
        columsData.suggests = [];
        responseData.documents.push(columsData);
      });
      return;
    }

    columns.forEach((columnSuggest, columnIndex) => {
      columnSuggest = columnSuggest.trim();
      if (!columnSuggest) {
        return;
      }

      if (responseData.documents[columnIndex]) {
        responseData.documents[columnIndex].suggests.push(columnSuggest);
      }
    })
  });
  

  response.send(responseData);
});

router.get('/Suggest/Get/Local', (request, response) => {

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
    response.json(suggestDatas);
  });
});


router.get('/Suggest/Get/L2', (request, response) => {
  response.json({ test: 'code' });
});


router.post('/Manager/Suggest/Manager/Add/Subject', (request, response) => {
  const subject = request.body.subject;
  redis.sadd('subject', subject);
  response.redirect('/Manager/Suggest/Manager');
});

router.post('/Manager/Application/Input/Version', (request, response) => {
  const appVersion = request.body.version;
  redis.set('appVersion', appVersion);
  response.redirect('/Manager/Notice/Manager');
});

router.post('/Manager/Suggest/Manager/Add/Suggest', (request, response) => {
  const subject = request.body.subject;
  const suggest = request.body.suggest;
  redis.multi()
    .sadd('subject', subject)
    .sadd(subject, suggest)
    .exec((error, result) => response.redirect('/Manager/Suggest/Manager'));
});

router.post('/Manager/Suggest/Manager/Remove/Suggest', (request, response) => {
  const subject = request.body.subject;
  const suggest = request.body.suggest;
  redis.multi()
    .srem(subject, suggest)
    .exec((error, result) => response.redirect('/Manager/Suggest/Manager'));
});

router.get('/Manager/Notice/Manager', (request, response) => {
  redis.lrange('noticeList', 0, -1, (error, notices) => {
    let templateData = {documents: []};
    try {
      notices = notices.filter((notice) => !JSON.parse(notice).remove).sort((a, b) => {
        return JSON.parse(b).orders - JSON.parse(a).orders;
      });
      notices.forEach((notice) => {
        templateData.documents.push(JSON.parse(notice));
      })
    } catch (e) {
      logger.custLog('공지사항을 가져오다가 오류가 발생했습니다.', e);
    } finally {
      redis.get('appVersion', (error, appVersion) => {
        templateData.appVersion = appVersion;
        response.send(noticeManagerTemplate(templateData));
      });
    }
  });
});

router.post('/Manager/Notice/Manager/Add/Notice', (request, response) => {
  const { title, isShow, contents, orders = 0} = request.body;
  const notice = {
    id: (new Date).getTime().toString(),
    title: title,
    isShow: isShow === 'on',
    contents: contents,
    orders,
    remove: false
  };
  redis.lpush('noticeList', JSON.stringify(notice), (error, statusResult) => {
    response.redirect('/Manager/Notice/Manager');
  });
});

router.post('/Manager/Notice/Manager/Remove/Notice', (request, response) => {
  const { id, title, isShow, contents, orders = 0} = request.body;
  const notice = {
    id: id,
    title: title,
    isShow: isShow === 'on',
    contents: contents,
    orders,
    remove: true
  };
  redis.lrange('noticeList', 0, -1, (error, notices) => {
    try {
      let currentIndex = 0;
      notices.forEach((notice, index) => {
        if (id === JSON.parse(notice).id) {
          currentIndex = index;
        }
      });
      redis.lset('noticeList', currentIndex, JSON.stringify(notice));
    } catch (e) {
      logger.custLog('공지사항을 가져오다가 오류가 발생했습니다.', e);
    } finally {
      response.redirect('/Manager/Notice/Manager');
    }
  });
});

router.post('/Manager/Notice/Manager/Put/Notice', (request, response) => {
  const { id, title, isShow, contents, orders = 0} = request.body;
  const notice = {
    id: id,
    title: title,
    isShow: isShow === 'on',
    contents: contents,
    orders,
    remove: false
  };
  redis.lrange('noticeList', 0, -1, (error, notices) => {
    try {
      let currentIndex = 0;
      notices.forEach((notice, index) => {
        if (id === JSON.parse(notice).id) {
          currentIndex = index;
        }
      });
      redis.lset('noticeList', currentIndex, JSON.stringify(notice));
    } catch (e) {
      logger.custLog('공지사항을 가져오다가 오류가 발생했습니다.', e);
    } finally {
      response.redirect('/Manager/Notice/Manager');
    }
  });
});

router.get('/Log/Today', (request, response) => {
  console.log((new Date).currentDay());
  response.sendFile(path.join(__dirname, `../../utilities/logger/log/${(new Date).currentDay()}.log`));
});


router.post('/Manager/database/all/flush/reset', (request, response) => {
  redis.flushall()
    .then(value => {
      logger.custLog('데이터 제거 중입니다.', value);
      response.send(true);
    });
});

router.post('/Rebuild', function(req, res, next) {
  shellExec('git pull && npm i && pm2 restart systemLiar | pm2 start --name systemLiar src/index.js');
  res.json({ result: 'success' });
});

// OUTPUT data

router.get('/app/version/', (request, response) => {
  response.json({ version: "4.6" });
});

router.get('/app/notices/', (request, response) => {
  redis.lrange('noticeList', 0, -1, (error, notices) => {
    let result = [];
    try {
      notices = notices.filter((notice) => !JSON.parse(notice).remove).sort((a, b) => {
        return JSON.parse(b).orders - JSON.parse(a).orders;
      });
      notices.forEach((notice) => {
        const noticeData = JSON.parse(notice);
        if (noticeData.isShow) {
          result.push({ title : noticeData.title, contents: noticeData.contents });
        }
      });
      response.json(result);
    } catch (e) {

    }
  });
});

module.exports = router;
