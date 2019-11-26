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
      // форматируем строковое представление даты, в соответствие с требованиями сайта
      let formatedDate =  moment(date).format("DD/MM/YYYY");
      // формируем HTTP запрос для получения котировок на текущий день с сайта ЦБ РФ
      const requestURL = `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${formatedDate}`;
      // отправляем запрос
      let xmlData = null;
      try {
        xmlData = await httpGet(requestURL);
      } catch (err) {
        return Promise.reject(err);
      }

      // извлекаем из полученного ответа данные в формате XML (в кодировке UTF-8)
      return new Promise(function(resolve, reject) {
        // преобразуем данные в формате XML в JavaScript объект
        parseString(xmlData, function(err, data) {
          if (!err) {

            // выбираем данные, подлежащие хранению
            let valutes = data.ValCurs.Valute;

            let mongoosePromises = [];
            valutes.forEach( function(valute) {

              let name = valute.Name["0"];
              let numCode = valute.NumCode["0"];
              let charCode = valute.CharCode["0"];

              let currency = new models.Currency({name, numCode, charCode});

              let currentDate = moment(data.ValCurs.$.Date, 'DD.MM.YYYY').toDate();
              let nominal = Number.parseInt(valute.Nominal["0"]);
              let value = Number.parseFloat(valute.Value["0"].replace(",", "."));

              let currencyRate = new models.CurrencyRate({date: currentDate,nominal, value});

              mongoosePromises.push(
                new Promise(function(resolve, reject) {
                  // обновляем или создаем сведения по валюте
                  models.CurrencyQuotes.findOneAndUpdate(
                    {'currency.charCode': charCode},
                    {$set: {'currency': currency}},
                    {upsert: true, new: true, useFindAndModify: false},
                    function(err, updatedCurrencyQuotes) {
                      if(!err) {
                        // обновляем сведения по котировкам для валюты
                        let index = updatedCurrencyQuotes.rates.findIndex(function (currencyRate) {
                          return currencyRate.date.getTime() == currentDate.getTime();
                        }, this);

                        // если элемент не найден, добавляем новую котировку для текущей валюты
                        if (index === -1) {
                          updatedCurrencyQuotes.rates.push(currencyRate);
                        } else { // если элемент найден, обновляем значение котировки для текущей валюты
                          updatedCurrencyQuotes.rates[index] = currencyRate;
                        }
                        // сохраняем обновленные сведения по валюте и ее котировкам
                        updatedCurrencyQuotes.save(function(err, currencyQuotes) {
                          if(!err) {
                            resolve(currencyQuotes);
                          } else {
                            reject(err);
                          }
                        }.bind(this));
                      } else {
                        reject(err);
                      }
                    }.bind(this));
                }.bind(this))
              );
            }.bind(this));

            Promise.all(mongoosePromises)
              .then(function(currencyQuotes) {
                resolve(currencyQuotes);
              }.bind(this));
          } else {
            reject(err);
          }
        }.bind(this));
      }.bind(this));
    }
  }
};
