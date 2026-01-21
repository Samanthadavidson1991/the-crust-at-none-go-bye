const mongoose = require('mongoose');

const takingsHistorySchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  takings: Object
});

module.exports = mongoose.model('TakingsHistory', takingsHistorySchema);