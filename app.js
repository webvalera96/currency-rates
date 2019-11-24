var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Agenda = require('agenda');
var Agendash = require('agendash');
var Moment = require('moment');
var MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
var level = require('level');
var xml2js = require('xml2js');
var iconv = require('iconv-lite');
var request= require('request');

// инициализируем хранилище
const db = level('db');

// библиотека для взаимодействия с API сайта ЦБР по протоколу HTTP
let {
  httpGet, chartGetDataset, makeReport
} = require('./lib/mylib')(request, iconv);

let {
  getQuotesByDate,
  getFcMarketLib
} = require('./lib/cbr')(moment, xml2js, db, httpGet);



const mongoConnectionString = 'mongodb://172.104.228.238:27017/agenda';

const agenda = new Agenda({db: {address: mongoConnectionString}});

var indexRouter = require('./routes/index')(db);
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/dash', Agendash(agenda));
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
