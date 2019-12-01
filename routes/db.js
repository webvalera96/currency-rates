module.exports = function({
  models,
  wlogger,
  httpClient,
  agenda,
  express,
  moment,
  xml2js
}) {
  const router = express.Router();


  /**
   * Маршрут для получения котировок валют на заданную дату
   * @category server
   * @name /db/quotes
   * @description Маршрут для получения котировок валют на заданную дату Path: "/db/quotes"
   * @param {GET} date_req - Дата в формате "DD/MM/YYYY"
   */
  router.get('/quotes', function(req, res, next) {
    let objectDate = moment(req.query.date_req, "DD/MM/YYYY").toDate();

    models.CurrencyQuotes.getQuotesByDate(objectDate, {moment, httpClient, xml2js})
      .then(function(currenciesQuotes) {
        res.send(JSON.stringify({
          realDate: currenciesQuotes[0].rates.date,
          arr: currenciesQuotes.map((currencyQuote) => {
            const {nominal, value} = currencyQuote.rates;
            return [
              currencyQuote.currency.numCode,
              currencyQuote.currency.charCode,
              nominal,
              currencyQuote.currency.name,
              value
            ]
          })
        }))
      }).catch(function(err){
      wlogger.log({
        level: 'error',
        message: err.stack
      });
      res.sendStatus(500);
    });
  });

  /**
   * Маршрут для составления отчета по нескольким котировок на заданный период времени или на текущую дату
   * @name /db/report
   * @function
   * @category server
   * @description Маршрут для составления отчета по нескольким котировок на заданный период времени или на текущую дату Path: "/db/report"
   * @param {GET}  begin_date - Дата в формате "DD/MM/YYYY"
   * @param {GET}  end_date - Дата в формта "DD/MM/YYYY"
   * @param {GET}  char_codes - Кодировки валют в формате JSON (Пример. ["AUD", "EUR"])
   */
  router.get('/report', function(req, res, next) {
    let startDate = moment(req.query.begin_date, 'DD/MM/YYYY').toDate();
    let endDate = req.query.end_date
      ? moment(req.query.end_date, 'DD/MM/YYYY').toDate(): null;
    let charCodes = JSON.parse(req.query.char_codes);

    models.CurrencyQuotes.getQuotesReport(charCodes, startDate, endDate)
      .then(function(reportJSON) {
        res.send(JSON.stringify(reportJSON, undefined, 2));
      }).catch(function(err) {
      wlogger.log({
        level: 'error',
        message: err.stack
      });
      res.sendStatus(500);
    })
  });

  /**
   * Маршрут для получения набора данных, для построения курса изменения валют в виде графика на заданный период
   * @name /db/chart/get/dataset
   * @function
   * @category server
   * @description Маршрут для получения набора данных, для построения курса изменения валют в виде графика на заданный период Path: "/db/chart/get/dataset"
   * @param {GET}  begin_date - Дата в формате "DD/MM/YYYY"
   * @param {GET}  end_date - Дата в формта "DD/MM/YYYY"
   * @param {GET}  char_code - Кодировка валюты (Прим. "AUD")
   */
  router.get('/chart/get/dataset', function(req, res, next) {


    let beginDate = moment(req.query.begin_date, "DD/MM/YYYY").toDate();
    let endDate = moment(req.query.end_date, "DD/MM/YYYY").toDate();
    let charCode = req.query.char_code;

    models.CurrencyQuotes.getChartDataset(beginDate, endDate, charCode, {agenda, moment})
      .then(function(dataSetJSON) {
        res.send(dataSetJSON);
      });
  });

  router.get('/fc/list', function(req, res, next) {
    models.CurrencyQuotes.getFcMarketLib()
      .then((fcList)=> {
        res.send(fcList)
      }).catch(function (err) {
      wlogger.log({
        level: 'error',
        message: err.stack
      });
      res.sendStatus(500);
    })
  });

  return router;
};