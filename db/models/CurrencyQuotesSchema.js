module.exports = function(mongoose, {Currency, CurrencyRate}) {
  const currencyRateSchema = require('./CurrencyRate/CurrencyRateSchema')(mongoose);
  const currencySchema = require('./Currency/CurrencySchema')(mongoose);

  /**
   * Класс, представляющий собой котировки валюты на разные даты в базе данных MongoDB
   * @class CurrencyQuotesSchema
   * @name CurrencyQuotesSchema
   * @type {Schema}
   */
  let currencyQuotesSchema = new mongoose.Schema({
    currency: currencySchema,
    rates: [currencyRateSchema]
  });

  /**
   * Статичный метод для получения отчета по котировкам
   * @category server
   * @param {String}charCodes - массив кодов валют, для которых необходимо построить отчет в формате JSON
   * @param {Date} startDate - начальная дата периода
   * @param {Date|null} endDate - конечная дата периода (если конечная дата не указана, используется только нач. дата)
   * @returns {Promise<[]>}
   */
  currencyQuotesSchema.statics.getQuotesReport = async function(charCodes, startDate, endDate = null) {
    if (charCodes && startDate && charCodes instanceof Array && startDate instanceof Date) {
      let currenciesQuotes = [];
      for (let i = 0; i < charCodes.length; i++ ) {
        let charCode = charCodes[i];

        try {
          let currencyQuotes = await this.aggregate()
            .match({
              'currency.charCode': charCode
            })
            .unwind('$rates')
            .match({
              'rates.date': endDate ? {
                '$gte': new Date(startDate.toISOString()),
                '$lte': new Date(endDate.toISOString())
              } : new Date(startDate.toISOString())
            })
            .group({
              _id: '$currency.charCode',
              'rates': {'$push': '$rates'}
            })
            .exec();
          currenciesQuotes.push(currencyQuotes);
        } catch (e) {
          if (e instanceof Error) {
            throw e;
          } else {
            throw new Error(e);
          }
        }
      }
      return currenciesQuotes;
    }
  };

  /**
   * Статичный метод для получения данных для построения графика изменения котировок за указанный период
   * @category server
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @param {String} charCode - символьный код валюты
   * @param agenda - модуль agenda
   * @param moment - модуль moment
   * @returns {Promise<unknown>}
   */
  currencyQuotesSchema.statics.getChartDataset = async function(startDate, endDate, charCode, {agenda, moment}) {
    let thisJob = await agenda.now('get quotes', {
      endDate: endDate,
      startDate: startDate,
      jId: new Date().getTime(),
      params: {
        charCode: charCode
      }
    });


    return new Promise(function(resolve, reject) {

      agenda.on(`fail:get quotes`, function(err, job) {
        if (thisJob.attrs.data.jId === job.attrs.data.jId) {
          reject(job.attrs.data.failReason);
        }
      });

      agenda.on(`success:get quotes`, function(job) {
        if (thisJob.attrs.data.jId === job.attrs.data.jId) {
          let {startDate, endDate} = job.attrs.data;
          let {charCode} = job.attrs.data.params;

          this.aggregate([
            {
              $match : {
                'currency.charCode': charCode
              }
            },
            {
              $unwind: '$rates'
            },
            {
              $match: {
                'rates.date': {
                  $gte: new Date(startDate.toISOString()),
                  $lte: new Date(endDate.toISOString())
                }
              }
            },
            {
              $group: {
                "_id": "$currency.charCode",
                "rates": { "$push": "$rates" }

              }
            }
          ]).exec(function(err, currencyQuote) {
            if (!err) {
              let currencyRates = currencyQuote[0].rates;

              let dataSet = {
                dates: [],
                values: []
              };

              // TODO: формирования набора данных, в зависимости от полученных данных
              // если между начальной и конечной датой больше трех месяцев, то на графике
              // отображать среднее значение котировок за месяц одной точкой
              // если между начальной и конечной датой больше трех лет, то на графике
              // отображать среднее значение котировок за год одной точкой

              let startDate = moment(currencyRates[0].date);
              let endDate = moment(currencyRates[currencyRates.length-1].date);

              if (endDate.diff(startDate, 'months') >= 3) {
                let averages = {};
                currencyRates.forEach( function(currencyRate) {
                  let date = moment(currencyRate.date);

                  let month = date.format('MM');
                  let year = date.format('YYYY');

                  if (! averages.hasOwnProperty(year) ) {
                    averages[year] = {};
                  } else if (! averages[year].hasOwnProperty(month)) {
                    averages[year][month] = {
                      sum: currencyRate.value,
                      count: 1
                    }
                  } else {
                    averages[year][month].sum += currencyRate.value;
                    averages[year][month].count++;
                  }

                }.bind(this));
                let arr = [];
                for (let year in averages) {
                  if (averages.hasOwnProperty(year)) {
                    for (let month in averages[year]) {
                      if (averages[year].hasOwnProperty(month)) {
                        let date = `${month}/${year}`;
                        let value = averages[year][month].sum / averages[year][month].count;

                        arr.push({
                          date, value
                        });
                      }
                    }
                  }
                }

                arr.sort(function(pair1, pair2) {
                  let a = moment(pair1.date, 'YYYY').toDate().getTime();
                  let b = moment(pair2.date, 'YYYY').toDate().getTime();
                  if ( a < b ) return -1;
                  if ( a > b) return 1;
                  if (a === b ) return 0;
                });

                arr.forEach((pair) => {
                  dataSet.dates.push(pair.date);
                  dataSet.values.push(pair.value);
                })

              } else if (endDate.diff(startDate, 'years') >= 3) {
                let averages = {};
                currencyRates.forEach( function(currencyRate) {
                  let date = moment(currencyRate.date);

                  let year = date.format('YYYY');

                  if (!averages.hasOwnProperty(year)) {
                    averages[year] = {
                      sum: currencyRate.value,
                      count: 1
                    }
                  } else {
                    averages[year].sum += currencyRate.value;
                    averages[year].count++;
                  }
                }.bind(this));

                let arr=[];
                for(let year in averages) {
                  if (averages.hasOwnProperty(year)) {
                    let date = `${year}`;
                    let value = averages[year].sum / averages[year].count;

                    arr.push({
                      date, value
                    })
                  }
                }

                arr.sort(function(pair1, pair2) {
                  let a = moment(pair1.date, 'YYYY').toDate().getTime();
                  let b = moment(pair2.date, 'YYYY').toDate().getTime();
                  if ( a < b ) return -1;
                  if ( a > b) return 1;
                  if (a === b ) return 0;
                });

                arr.forEach((pair) => {
                  dataSet.dates.push(pair.date);
                  dataSet.values.push(pair.value);
                })

              } else {
                currencyRates.forEach( (currencyRate) => {
                  dataSet.dates.push(moment(currencyRate.date).format('DD/MM/YYYY'));
                  dataSet.values.push(currencyRate.value);
                });
              }
              resolve(JSON.stringify(dataSet));
            } else {
              reject(err);
            }
          }.bind(this));
        }
      }.bind(this));


    }.bind(this));
  };

  currencyQuotesSchema.statics.getQuotesByDate = async function(date, {moment, httpClient, xml2js}) {
    const parser = new xml2js.Parser();

    if (date instanceof Date) {
      try {
        // удаляем время в дате
        let momentDate = moment(date).startOf('day');

        // ЦБ РФ не выставляет котировки в не рабочие дни
        // Если указана дата не рабочего дня
        // получим дату рабочего дня
        if (!momentDate.isBusinessDay()) {
          date = momentDate.prevBusinessDay().toDate();
        }
        let currenciesQuotes = await this.aggregate()
          .unwind('$rates')
          .match({'rates.date': new Date(date.toISOString())})
          .exec();
        if (currenciesQuotes.length) {
          return currenciesQuotes;
        } else {
          let formattedDate = moment(date).format('DD/MM/YYYY');
          const url = `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${formattedDate}`;
          let xmlData = await httpClient.httpRequest(url);
          let data = await parser.parseStringPromise(xmlData);
          let valutes = data.ValCurs.Valute;

          let currentDate = moment(data.ValCurs.$.Date, 'DD.MM.YYYY').toDate();
          let currenciesQuotes = await this.aggregate()
            .unwind('$rates')
            .match({
              'rates.date': new Date(currentDate.toISOString())
            })
            .exec();
          if (currenciesQuotes.length) {
            return currenciesQuotes
          } else {
            for (let i = 0; i < valutes.length; i++) {
              let valute = valutes[i];
              let name = valute.Name["0"];
              let numCode = valute.NumCode["0"];
              let charCode = valute.CharCode["0"];
              let currency = new Currency({name, numCode, charCode});
              let nominal = Number.parseInt(valute.Nominal["0"]);
              let value = Number.parseFloat(valute.Value["0"].replace(",", "."));
              let currencyRate = new CurrencyRate({date: currentDate,nominal, value});
              let updatedCurrencyQuotes = await this.findOneAndUpdate(
                {'currency.charCode': charCode},
                {$set: {'currency': currency}},
                {upsert: true, new: true, useFindAndModify: false}
              ).exec();

              let index = updatedCurrencyQuotes.rates.findIndex(function (currencyRate) {
                return currencyRate.date.getTime() == currentDate.getTime();
              }, this);

              if (index === -1) {
                // добавляем новую котировку для текущей валюты
                await this.updateOne(
                  {
                    _id: updatedCurrencyQuotes._id
                  },
                  {
                    $push: {rates: currencyRate}
                  }
                );
              } else { // если элемент найден, обновляем значение котировки для текущей валюты
                await this.updateOne(
                  {
                    _id: updatedCurrencyQuotes._id,
                    'rates.date': currentDate
                  },
                  {
                    $set: {"rates.$": currencyRate}
                  }).exec();
              }
              await this.updateOne(
                {
                  _id: updatedCurrencyQuotes._id
                },
                {
                  $push: {
                    rates: {
                      $each: [],
                      $sort: {
                        date: 1
                      }
                    }
                  }
                }).exec();
            }
            return await this.aggregate()
              .unwind('$rates')
              .match({
                'rates.date': new Date(date.toISOString())
              });
          }


        }
      } catch (err) {
        if (err instanceof  Error) {
          throw err;
        } else {
          throw new Error(err);
        }
      }
    } else {
      throw new TypeError(`Expected parameter with type Date, but get ${typeof date}`);
    }
  };

  currencyQuotesSchema.statics.getFcMarketLib = async function() {
    try {
      let currencyQuotes =
        await this
          .find({})
          .select({ 'currency.name': 1, 'currency.charCode': 1})
          .exec();
      return JSON.stringify(currencyQuotes.map((currencyQuote) => {
        return [ currencyQuote.currency.name, currencyQuote.currency.charCode];
      }))
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error(err);
      }
    }
  };

  return currencyQuotesSchema;
};