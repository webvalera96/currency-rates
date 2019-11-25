module.exports = function(mongoose) {
  const currencySchema = require('./CurrencySchema')(mongoose);
  return mongoose.model('Currency', currencySchema);
};