module.exports = function(mongoose) {
  const DateMap = require('./DateMap/DateMap')(mongoose);
  const Currency = require('./Currency/Currency')(mongoose);
  const CurrencyRate = require('./CurrencyRate/CurrencyRate')(mongoose);
  const CurrencyQuotes = require('./CurrencyQuotes')(mongoose, {Currency, CurrencyRate, DateMap});

  return {CurrencyQuotes, Currency, CurrencyRate, DateMap};
};

