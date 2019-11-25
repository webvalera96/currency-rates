module.exports = function(mongoose) {
  const currencyQuotesSchema = require('./CurrencyQuotesSchema')(mongoose);

  return mongoose.model('CurrencyQuotes', currencyQuotesSchema);
};