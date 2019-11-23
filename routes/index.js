var express = require('express');
var router = express.Router();
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
  httpGet
} = require('../lib/mylib')(request, iconv);

let {
  getQuotesByDate,
  getFcMarketLib
} = require('../lib/cbr')(moment, xml2js, db, httpGet);



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Информационная системы "Курсы валют"' });
});

/* API */
router.get('/quotes', function(req, res, next) {
  // ?date_req = "DD/MM/YYYY"
  let stringDate = req.query.date_req;
  let objectDate = moment(req.query.date_req, "DD/MM/YYYY").toDate();

  getQuotesByDate(objectDate).then(() => {
    db.get(stringDate, function(err, valutes) {
      //TODO: обработка ошибок (не найдена такая дата)
      res.send(valutes);
    })
  })
});

router.get('/chart/get/dataset', function(req, res, next) {
  // ?begin_date = "DD/MM/YYYY"
  // ?end_date = "DD/MM/YYYY"
  // ?char_code = "CODE"
  // TODO: реализовать обработку ошибок (неправильный формат даты, не указаны параметры)
  this.beginDate = moment(req.query.begin_date, "DD/MM/YYYY").toDate();
  this.endDate = moment(req.query.end_date, "DD/MM/YYYY").toDate();
  this.charCode = req.query.char_code;


  // TODO: обработка ошибок работы с базой данных

  (new Promise(function(resolve, reject) {
    let keySet = [];
    db.createKeyStream()
      .on('data', function(date) {
        keySet.push(date);
      })
      .on('end', function() {
        let dateArray = [];
        keySet.forEach((dateKey) => {
          dateArray.push(moment(dateKey, "DD/MM/YYYY").toDate());
        });
        // выбираем даты из заданного пользователем периода времени
        let rangedDateArray = [];
        dateArray.forEach(function(date) {
          let range = moment().range(beginDate, endDate);
          if (range.contains(date)) {
            rangedDateArray.push(date);
          }
        });
        resolve(rangedDateArray);
      })
      .on('error', function(err) {
        reject(err);
      });
  })).then(function(rangedDateArray) {
    // сформируем наборы данных для построения графика
    let dataSet = {
      // форматируем массив дат
      dates: rangedDateArray.map(function(date) {
        return moment(date).format("DD/MM/YYYY");
      }),
      values: []
    };
    let promises = [];
    rangedDateArray.forEach(function(date) {
      let promise = new Promise(function(resolve, reject) {
        db.get(moment(date).format("DD/MM/YYYY"), function(err, dataJSON) {
          if (!err) {
            resolve(dataJSON);
          } else {
            reject(err);
          }
        })
      });
      promises.push(promise);
      promise.then(function(dataJSON) {
        let data = JSON.parse(dataJSON);
        data.data.forEach(function(value) {
          // определяем значение курса для текущей валюты
          if (value[1] === charCode) {
            dataSet.values.push(Number(Number.parseFloat(value[4])/Number.parseInt(value[2])).toFixed(4));
          }
        });
      }.bind(this));
    }.bind(this));
    Promise.all(promises).then(function() {
      res.send(JSON.stringify(dataSet));
    }.bind(this));
  }.bind(this));


  // TODO: сделать проверку, что диапазон указан правильно
});

router.get('/fc/list', function(req, res, next) {
  getFcMarketLib()
      .then((fcList)=> {
        res.send(fcList)
      })
});

router.delete('/db', function(req, res, next) {
  db.clear(function(err) {
    if (!err) {
      res.sendStatus('200');
    } else {
      res.sendStatus('505');
    }
  });
});



module.exports = router;
