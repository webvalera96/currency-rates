module.exports = function(mongoose) {
  return new mongoose.Schema({
    date: Date,
    nominal: Number,
    value: Number
  })
};