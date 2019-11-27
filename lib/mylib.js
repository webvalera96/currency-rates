module.exports = function(request, iconv, models, moment, repeater) {
  return {
    httpGet: async function(url) {
      return new Promise(((resolve, reject) => {
        let options = {
          url: url,
          encoding: null,
          timeout: 1500
        };

        repeater.request(options)
          .then(function(response) {
            const {err, body} = response[0];
            if(!err) {
              if(body) {
                // для обработки строк в JS перекодируем данные в кодировке utf8
                let c = iconv.encode(iconv.decode(body, 'windows-1251'), 'utf8').toString();
                resolve(c);
              } else {
                reject(body);
              }
            } else {
              reject(err);
            }
          }.bind(this));
      }))
    },
    makeReport(dataSet, currency) {
      let report = {
        [currency] : []
      };

      for(let i = 0; i < dataSet.dates.length; i++) {
        report[currency].push({
          "date": dataSet.dates[i],
          "value": dataSet.values[i]
        });
      }
      return JSON.stringify(report);
    },


    // получение данных для построения графика стоимости валют
    chartGetDataset(beginDate, endDate, charCode) {

      return new Promise(function(resolve, reject) {

        models.CurrencyQuotes.aggregate([
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
                $gte: new Date(beginDate.toISOString()),
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

            currencyRates.forEach( (currencyRate) => {
              dataSet.dates.push(moment(currencyRate.date).format('DD/MM/YYYY'));
              dataSet.values.push(currencyRate.value);
            });


            resolve(JSON.stringify(dataSet));
          } else {
            reject(err);
          }
        }.bind(this));

      });
    }
  }
};