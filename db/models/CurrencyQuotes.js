module.exports = function(mongoose, {Currency, CurrencyRate}) {
  const currencyQuotesSchema = require('./CurrencyQuotesSchema')(mongoose, {Currency, CurrencyRate});

  return mongoose.model('CurrencyQuotes', currencyQuotesSchema);
};