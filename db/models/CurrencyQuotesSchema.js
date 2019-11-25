module.exports = function(mongoose) {
  const currencyRateSchema = require('./CurrencyRate/CurrencyRateSchema')(mongoose);
  const currencySchema = require('./Currency/CurrencySchema')(mongoose);


  return new mongoose.Schema({
    currency: currencySchema,
    rates: [currencyRateSchema]
  })
};