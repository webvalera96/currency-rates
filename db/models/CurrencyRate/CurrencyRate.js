module.exports = function(mongoose) {
  const currencyRateSchema = require('./CurrencyRateSchema')(mongoose);
  return mongoose.model('CurrencyRate', currencyRateSchema)
};