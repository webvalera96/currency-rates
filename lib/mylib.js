module.exports = function(request, iconv) {
  return {
    httpGet: async function(url) {
      return new Promise(((resolve, reject) => {
        let config = {
          url: url,
          encoding: null
        };

        request(config, (err, result, body) => {
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
        })
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
    chartGetDataset(beginDate, endDate, charCode,db, moment) {


      return new Promise(function(resolve, reject) {
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
      }).then(function(rangedDateArray) {
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
          promises.push(
            db.get(moment(date).format("DD/MM/YYYY"))
              .then(function(dataJSON) {
                let data = JSON.parse(dataJSON);
                data.data.forEach(function(value) {
                  // определяем значение курса для текущей валюты
                  if (value[1] === charCode) {
                    dataSet.values.push(Number(Number.parseFloat(value[4])/Number.parseInt(value[2])).toFixed(4));
                  }
                });
              })
          )
        }.bind(this));

        return Promise.all(promises)
          .then(function() {
            // обработаем полученные данные по возрастанию дат
            // для построения графика
            dataSet.values = dataSet.values.map(function(value) {
              return Number.parseFloat(value);
            });

            for(let i = 0; i < dataSet.dates.length-1; i++) {
              for(let j = 0; j < dataSet.dates.length-i; j++)
              {
                if (moment(dataSet.dates[j+1], "DD/MM/YYYY").toDate() < moment(dataSet.dates[j], "DD/MM/YYYY").toDate()) {
                  // меняем даты
                  let temp = dataSet.dates[j+1];
                  dataSet.dates[j+1] = dataSet.dates[j];
                  dataSet.dates[j] = temp;

                  // меняем данные
                  temp = dataSet.values[j+1];
                  dataSet.values[j+1] = dataSet.values[j];
                  dataSet.values[j] = temp;
                }
              }
            }
            return JSON.stringify(dataSet);
          }.bind(this));
      }.bind(this));


    }
  }
};