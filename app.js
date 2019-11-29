const serverConfigs = require('./server.config');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const Agenda = require('agenda');
const Agendash = require('agendash');
const Moment = require('moment-business-days');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);

moment.locale('ru');
moment.updateLocale('ru', {
  workingWeekdays: [ 2, 3, 4, 5], // 0 - Воскресенье, 6 - Понедельник !!!
});
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
const repeater = new Repeater(serverConfigs.server.interval);

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


const HTTPClient = require('./lib/HTTPClient')({events, request,wlogger, iconv});
const httpClient = new HTTPClient(serverConfigs.server.interval);

const models = require('./db/models/index')(mongoose);

// задача получения котировок
agenda.define('get quotes', async function (job, done) {
  let {startDate, endDate} = job.attrs.data;
  if (startDate instanceof Date && endDate instanceof Date) {
    try {
      for(let date = startDate; date <= endDate; date = moment(date).add(1, 'day').toDate()) {
        await models.CurrencyQuotes.getQuotesByDate(date, {moment, httpClient, xml2js});
      }
      done();
    } catch (err) {
      if (err instanceof Error) {
        done(err);
      } else {
        done(new Error(err));
      }
    }
  } else {
    done(new TypeError(`Expected {startDate, endDate} to be both Date but get {${typeof startDate},${typeof endDate}}`));
  }

}.bind(this));

agenda.define('get quotes for today', async function (job) {
  // загрузка данных котировок на сегодняшний день
  let date = new Date();
  await models.CurrencyQuotes.getQuotesByDate(date, {moment, httpClient, xml2js});
}.bind(this));



let indexRouter = require('./routes/index')(models, wlogger, repeater, httpClient, agenda);
let usersRouter = require('./routes/users');

let app = express();

// view engine setup
app.set('agenda', agenda);
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





module.exports = app;
