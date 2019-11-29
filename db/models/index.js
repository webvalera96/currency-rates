module.exports = function(mongoose) {

  const Currency = require('./Currency/Currency')(mongoose);
  const CurrencyRate = require('./CurrencyRate/CurrencyRate')(mongoose);
  const CurrencyQuotes = require('./CurrencyQuotes')(mongoose, {Currency, CurrencyRate});

  return {CurrencyQuotes, Currency, CurrencyRate};
};

