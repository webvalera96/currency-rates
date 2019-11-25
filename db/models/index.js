module.exports = function(mongoose) {
  const CurrencyQuotes = require('./CurrencyQuotes')(mongoose);
  const Currency = require('./Currency/Currency')(mongoose);
  const CurrencyRate = require('./CurrencyRate/CurrencyRate')(mongoose);

  return {CurrencyQuotes, Currency, CurrencyRate};
};

