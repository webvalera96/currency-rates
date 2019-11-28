module.exports = function (moment, xml2js, models, httpGet) {
  const parseString = xml2js.parseString;

  return {
    // сформируем список валют, для которых известны котировки
    getFcMarketLib: async function() {

      return new Promise(function(resolve, reject) {
        models.CurrencyQuotes.find({}, function(err, currencyQuotes) {
          if(!err) {
            let arr=[];

            currencyQuotes.forEach(function(currencyQuote) {
              arr.push([
                currencyQuote.currency.name,
                currencyQuote.currency.charCode
              ])
            }.bind(this));

            resolve(JSON.stringify(arr))
          } else {
            reject(err);
          }
        }.bind(this));
      });
    },
    // получает котировки на заданный день и сохраняет их (или обновляет) в хранилище
    // date: базовый объект JavaScrip [Date]
    getQuotesByDate : async function (date) {
      let momentDate = moment(date).startOf('day');
      if (!momentDate.isBusinessDay()) {
        momentDate = momentDate.prevBusinessDay()
      }
      this.date = momentDate.toDate();
      // извлекаем из полученного ответа данные в формате XML (в кодировке UTF-8)
      return new Promise(function(resolve, reject) {
        // форматируем строковое представление даты, в соответствие с требованиями сайта

        let d = this.date;
        let formatedDate =  moment(this.date).format("DD/MM/YYYY");


        models.CurrencyQuotes.aggregate([
          {
            $unwind: '$rates'
          },
          {
            $match: {
              'rates.date': new Date(d.toISOString())
            }
          }]).exec(function(err, currenciesQuotes) {
            if (!err && currenciesQuotes.length) {
              resolve(currenciesQuotes);
            } else {
              // формируем HTTP запрос для получения котировок на текущий день с сайта ЦБ РФ
              const requestURL = `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${formatedDate}`;
              // отправляем запрос
              try {
                httpGet(requestURL)
                  .then(function(xmlData) {
                    parseString(xmlData, function(err, data) {
                      if (!err) {

                        // выбираем данные, подлежащие хранению
                        let valutes = data.ValCurs.Valute;


                        valutes.forEach( function(valute) {

                          let name = valute.Name["0"];
                          let numCode = valute.NumCode["0"];
                          let charCode = valute.CharCode["0"];

                          let currency = new models.Currency({name, numCode, charCode});

                          let currentDate = moment(data.ValCurs.$.Date, 'DD.MM.YYYY').toDate();

                          let nominal = Number.parseInt(valute.Nominal["0"]);
                          let value = Number.parseFloat(valute.Value["0"].replace(",", "."));

                          let currencyRate = new models.CurrencyRate({date: currentDate,nominal, value});
                          models.CurrencyQuotes.aggregate([
                            {
                              $unwind: '$rates'
                            },
                            {
                              $match: {
                                'rates.date': new Date(currentDate.toISOString())
                              }
                            }]).exec(function(err, currenciesQuotes) {
                              if (!err && currenciesQuotes.length) {
                                resolve(currenciesQuotes);
                              } else {
                                let mongoosePromises = [];
                                mongoosePromises.push(
                                  new Promise(function(resolve, reject) {
                                    // обновляем или создаем сведения по валюте
                                    models.CurrencyQuotes.findOneAndUpdate(
                                      {'currency.charCode': charCode},
                                      {$set: {'currency': currency}},
                                      {upsert: true, new: true, useFindAndModify: false},
                                      async function(err, updatedCurrencyQuotes) {
                                        if(!err) {
                                          // обновляем сведения по котировкам для валюты
                                          let index = updatedCurrencyQuotes.rates.findIndex(function (currencyRate) {
                                            return currencyRate.date.getTime() == currentDate.getTime();
                                          }, this);

                                          // если элемент не найден
                                          try {
                                            if (index === -1) {
                                              // добавляем новую котировку для текущей валюты
                                              await models.CurrencyQuotes.updateOne(
                                                {
                                                  _id: updatedCurrencyQuotes._id
                                                },
                                                {
                                                  $push: {rates: currencyRate}
                                                }
                                              );
                                            } else { // если элемент найден, обновляем значение котировки для текущей валюты
                                              await models.CurrencyQuotes.updateOne(
                                                {
                                                  _id: updatedCurrencyQuotes._id,
                                                  'rates.date': currentDate
                                                },
                                                {
                                                  $set: {"rates.$": currencyRate}
                                                })
                                            }
                                            // сортируем котировки валюты по дате в порядке возрастания
                                            models.CurrencyQuotes.updateOne(
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
                                              }
                                            ,
                                            function(err, wop) {
                                                if (!err) {
                                                  resolve(wop);
                                                } else {
                                                  resolve(err);
                                                }
                                            }.bind(this));
                                          } catch(err) {
                                            reject(err);
                                          }
                                        } else {
                                          reject(err);
                                        }
                                      }.bind(this));
                                  }.bind(this))
                                );
                                Promise.all(mongoosePromises)
                                  .then(function(statusArray) {
                                    let status = statusArray.every((status) => {
                                      return status;
                                    });

                                    if (status) {
                                      let d = moment(formatedDate, 'DD/MM/YYYY').toDate(); // избавляемся от временной составляющей
                                      models.CurrencyQuotes.aggregate([
                                        {
                                          $unwind: '$rates'
                                        },
                                        {
                                          $match: {
                                            'rates.date': new Date(d.toISOString())
                                          }
                                        }]).exec(function(err, currenciesQuotes) {
                                        resolve(currenciesQuotes);
                                      });
                                    } else {
                                      reject(status);
                                    }


                                  }.bind(this));
                              }
                            }.bind(this));
                        }.bind(this));
                      } else {
                        reject(err);
                      }
                    }.bind(this));
                  }.bind(this))
              } catch (err) {
                reject(err);
              }
            }
        }.bind(this));







      }.bind(this)).then(function(selectedCurrencyQuotesByDate) {
        return selectedCurrencyQuotesByDate;
      }.bind(this));
    }
  }
};
