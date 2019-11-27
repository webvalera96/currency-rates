module.exports = {
  server: {
    interval: 1
  },
  mongodb: {
    hostname: 'localhost',
    port: 27017,
    dbname: 'currencyRates'
  },
  agenda: {
    collectionName: 'agenda',
    agendashUrl: '/dash'
  }
};