module.exports = function(mongoose) {
  /**
   * Класс, представляющий собой сведения о валюте в базе данных MongoDB
   * @name DateMapSchema
   * @class DateMapSchema
   */
  return new mongoose.Schema({
    date: {
      type: Date,
      unique: true
    },
    altDate: Date
  })
};