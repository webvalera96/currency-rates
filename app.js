const serverConfigs = require('./server.config');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const Agenda = require('agenda');
const Agendash = require('agendash');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const xml2js = require('xml2js');
const iconv = require('iconv-lite');
const request= require('request-promise');
const mongoose = require('mongoose');
const events = require('events');

const winston = require('winston');
const wlogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({filename: './log/error.log', level: 'error'}),
    new winston.transports.File({filename:'./log/combined.log'})
  ]
});

const Repeater = require('./lib/Repeater')(events, request, wlogger);
const repeater = new Repeater(serverConfigs.server.interval)

if (process.env.NODE_ENV !== 'production') {
  wlogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const mongoConnectionString =
  `mongodb://${serverConfigs.mongodb.hostname}:${serverConfigs.mongodb.port}/${serverConfigs.mongodb.dbname}`;

mongoose.connect(
  mongoConnectionString,
  {useNewUrlParser: true});

const agenda = new Agenda({
  db: {
    address: mongoConnectionString,
    collection: serverConfigs.agenda.collectionName
  }
});

// инициализируем хранилище
// const db = level('db');
const models = require('./db/models/index')(mongoose);

// библиотека для взаимодействия с API сайта ЦБР по протоколу HTTP
let {
  httpGet, chartGetDataset, makeReport
} = require('./lib/mylib')(request, iconv, models, moment, repeater);

let {
  getQuotesByDate,
  getFcMarketLib
} = require('./lib/cbr')(moment, xml2js, models, httpGet);

let indexRouter = require('./routes/index')(models, wlogger, repeater);
let usersRouter = require('./routes/users');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(serverConfigs.agenda.agendashUrl, Agendash(agenda));
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

agenda.define('get quotes for month', async function (job) {
  let endDate = moment(new Date());
  let startDate = moment(endDate).subtract(30, 'days');
  for(let date = startDate; date.toDate() <= endDate.toDate(); date = date.add(1, 'day')) {
    await getQuotesByDate(date);
  }

}.bind(this));

agenda.define('get quotes for today', async function (job) {
  // загрузка данных котировок на сегодняшний день
  let date = new Date();
  await getQuotesByDate(date);
}.bind(this));

app.set('agenda', agenda);


module.exports = app;
