module.exports = function(mongoose, {Currency, CurrencyRate, DateMap}) {
  const currencyQuotesSchema = require('./CurrencyQuotesSchema')(mongoose, {Currency, CurrencyRate, DateMap});

  return mongoose.model('CurrencyQuotes', currencyQuotesSchema);
};