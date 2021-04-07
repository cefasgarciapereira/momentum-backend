const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
require('dotenv/config');

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/test', (req, res) => {
    res.status(200).send('ok')
})

require('./app/controllers/user')(app);
require('./app/controllers/strategy')(app);
require('./app/controllers/backtest')(app);
require('./app/controllers/closeFriends')(app);

app.listen(process.env.PORT || 9000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});