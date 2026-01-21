const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  orders: [Object]
});

module.exports = mongoose.model('OrderHistory', orderHistorySchema);