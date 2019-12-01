module.exports = function(mongoose) {
  /**
   * Класс для представления котировки валюты на определенную дату в базе данных MongoDB
   * @class CurrencyRateSchema
   * @name CurrencyRateSchema
   * @category server
   */
  return new mongoose.Schema({
    date: Date,
    nominal: Number,
    value: Number
  })
};