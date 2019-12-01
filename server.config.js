const moment = require('moment');
let now = moment(new Date).startOf('day');

module.exports = {
  server: {
    interval: 1000,
    noQueue: false
  },
  mongodb: {
    hostname: 'localhost',
    port: 27017,
    dbname: 'currencyRates'
  },
  agenda: {
    collectionName: 'agenda',
    agendashUrl: '/dash',
    endDate: moment(now).toDate(),
    startDate: moment(now).subtract(30, 'days').toDate()
  }
};