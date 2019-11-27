module.exports = function(models, wlogger, repeater) {
  const express = require('express');
  const router = express.Router();
  const Moment = require('moment');
  const MomentRange = require('moment-range');
  const moment = MomentRange.extendMoment(Moment);
  const xml2js = require('xml2js');
  const iconv = require('iconv-lite');
  const request= require('request');


// библиотека для взаимодействия с API сайта ЦБР по протоколу HTTP
  let {
    httpGet, chartGetDataset, makeReport
  } = require('../lib/mylib')(request, iconv, models, moment, repeater);

  let {
    getQuotesByDate,
    getFcMarketLib
  } = require('../lib/cbr')(moment, xml2js, models, httpGet);



  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Информационная системы "Курсы валют"' });
  });

  /* API */
  router.get('/quotes', function(req, res, next) {
    // ?date_req = "DD/MM/YYYY"
    let stringDate = req.query.date_req;
    let objectDate = moment(req.query.date_req, "DD/MM/YYYY").toDate();

    getQuotesByDate(objectDate)
      .then(function(currenciesQuotes) {
        let realDate = currenciesQuotes[0].rates[0].date;
        let arr = [];
        currenciesQuotes.forEach(function(currencyQuote) {
          const {nominal, value} = currencyQuote.rates[0];
          arr.push([
            currencyQuote.currency.numCode,
            currencyQuote.currency.charCode,
            nominal,
            currencyQuote.currency.name,
            value
          ])
        });

        res.send(JSON.stringify({
          realDate,
          arr
        }));
      }.bind(this)).catch(function(err) {
        wlogger.log({
          level: 'error',
          message: err.stack
        });
        res.sendStatus(500);
      }.bind(this))


  });

  router.get('/chart/get/dataset', function(req, res, next) {
    // begin_date - "DD/MM/YYYY" (строка, заданного формата)
    // ?end_date = "DD/MM/YYYY" (строка, заданного формата)
    // ?char_code = "CODE" (строка)


    let beginDate = moment(req.query.begin_date, "DD/MM/YYYY").toDate();
    let endDate = moment(req.query.end_date, "DD/MM/YYYY").toDate();
    let charCode = req.query.char_code;
    chartGetDataset(beginDate, endDate, charCode)
      .then(function(dataSetJSON) {
        res.send(dataSetJSON);
      })
  });

  router.get('/fc/list', function(req, res, next) {
    getFcMarketLib()
      .then((fcList)=> {
        res.send(fcList)
      }).catch(function (err) {
        wlogger.log({
          level: 'error',
          message: err.stack
        })
      })
  });

  router.delete('/db', function(req, res, next) {
    res.sendStatus(200);
  });

  router.get('/report', function(req, res, next) {
    // begin_date - "DD/MM/YYYY" (строка, заданного формата)
    // ?end_date = "DD/MM/YYYY" (строка, заданного формата)
    // ?char_code = "CODE" (строка)
    let beginDate = moment(req.query.begin_date, "DD/MM/YYYY").toDate();
    let endDate = moment(req.query.end_date, "DD/MM/YYYY").toDate();
    let charCode = req.query.char_code;
    chartGetDataset(beginDate, endDate, charCode)
      .then(function(dataSetJSON) {
        res.send(makeReport(JSON.parse(dataSetJSON), charCode));
      }).catch(function(err) {
        wlogger.log({
          level: err,
          message: err.stack
        })
      })
  });

  return router;
};