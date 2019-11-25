module.exports = function(mongoose) {
  return new mongoose.Schema({
    name: String,
    numCode: String,
    charCode: String
  })
};