module.exports = function(mongoose) {

  /**
   * Класс, представляющий собой сведения о валюте в базе данных MongoDB
   * @name CurrencySchema
   * @class CurrencySchema
   */
  return new mongoose.Schema({
    name: String,
    numCode: String,
    charCode: String
  })
};