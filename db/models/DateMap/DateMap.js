module.exports = function(mongoose) {
  const dateMapSchema = require('./DateMapSchema')(mongoose);
  return mongoose.model('DateMap', dateMapSchema);
};