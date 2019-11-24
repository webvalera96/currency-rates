module.exports = function(db) {
  var express = require('express');
  var router = express.Router();
  var Moment = require('moment');
  var MomentRange = require('moment-range');
  const moment = MomentRange.extendMoment(Moment);
  var level = require('level');
  var xml2js = require('xml2js');
  var iconv = require('iconv-lite');
  var request= require('request');


// библиотека для взаимодействия с API сайта ЦБР по протоколу HTTP
  let {
    httpGet, chartGetDataset, makeReport
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

        res.send(valutes);
      })
    })


  });

  router.get('/chart/get/dataset', function(req, res, next) {
    // begin_date - "DD/MM/YYYY" (строка, заданного формата)
    // ?end_date = "DD/MM/YYYY" (строка, заданного формата)
    // ?char_code = "CODE" (строка)


    this.beginDate = moment(req.query.begin_date, "DD/MM/YYYY").toDate();
    this.endDate = moment(req.query.end_date, "DD/MM/YYYY").toDate();
    this.charCode = req.query.char_code;
    chartGetDataset(beginDate, endDate, charCode, db, moment)
      .then(function(dataSetJSON) {
        res.send(dataSetJSON);
      })
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

  router.get('/report', function(req, res, next) {
    // begin_date - "DD/MM/YYYY" (строка, заданного формата)
    // ?end_date = "DD/MM/YYYY" (строка, заданного формата)
    // ?char_code = "CODE" (строка)
    this.beginDate = moment(req.query.begin_date, "DD/MM/YYYY").toDate();
    this.endDate = moment(req.query.end_date, "DD/MM/YYYY").toDate();
    this.charCode = req.query.char_code;
    chartGetDataset(beginDate, endDate, charCode, db, moment)
      .then(function(dataSetJSON) {
        res.send(makeReport(JSON.parse(dataSetJSON), charCode));
      })
  });

  return router;
};