const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
require('dotenv/config');

if (process.env.SERVER_ENV === 'DEV' || process.env.SERVER_ENV === 'HOMOLOG') {
  var allowedOrigins = ['http://localhost:3000'];
} else {
  var allowedOrigins = [
    'https://www.easyquant.com.br',
    'http://www.easyquant.com.br',
    'https://homolog-easyquant.netlify.app',
    'http://homolog-easyquant.netlify.app'
  ];

}

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/test', (req, res) => {
  res.status(200).send('ok')
})

require('./app/controllers/user')(app);
require('./app/controllers/strategy')(app);
require('./app/controllers/backtest')(app);
require('./app/controllers/closeFriends')(app);
require('./app/controllers/price')(app);
require('./app/controllers/plans')(app);
require('./app/controllers/ticker')(app);

app.listen(process.env.PORT || 9000, function () {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});