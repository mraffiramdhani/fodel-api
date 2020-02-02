require('dotenv').config()
const express = require('express'),
  cors = require('cors'),
  // path = require('path'),
  // eslint-disable-next-line import/no-extraneous-dependencies
  morgan = require('morgan'),
  compression = require('compression'),
  bodyParser = require('body-parser'),
  responseTime = require('response-time'),
  router = require('./Routes'),
  port = process.env.APP_PORT || 8001;

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors());
app.use(responseTime());
app.use(compression());
app.use(`/api/v${process.env.API_VERSION}`, router);
// app.use('/images', express.static(path.join(__dirname, 'public/images')));
// app.use('/logos', express.static(path.join(__dirname, 'public/logos')));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log('App Listen on Port ', port);
});
