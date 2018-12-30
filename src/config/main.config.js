const cors = require('cors');
const bodyParser = require('body-parser');
const expressSession = require('express-session');

module.exports = (app) => {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended:true}));

  app.session = expressSession({
    secret: '&%^%SYSTEM%LIAR%^%&',
    resave: true,
    saveUninitialized: true,
    autoSave: true
  });
  app.use(app.session);

};
