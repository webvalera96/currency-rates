module.exports = function(request, iconv, models, moment, repeater, xml2js, agenda, httpClient) {

  function makeReport(dataSet, currency) {
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
  }

  let httpGet = async function(url) {
    return new Promise(((resolve, reject) => {
      let options = {
        url: url,
        encoding: null,
        timeout: 1500
      };

      repeater.request(options)
        .then(function(response) {


            if(response) {
              const {err, body} = response[0];
              if (!err) {
                // для обработки строк в JS перекодируем данные в кодировке utf8
                let c = iconv.encode(iconv.decode(body, 'windows-1251'), 'utf8').toString();
                resolve(c);
              } else {
                reject(err);
              }
            } else {
              reject(response);
            }
        }.bind(this));
    }))
  };

  let chartGetDataset = async function chartGetDataset(startDate, endDate, charCode) {

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

  return {httpGet,chartGetDataset, makeReport};
};