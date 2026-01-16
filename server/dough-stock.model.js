const mongoose = require('mongoose');

const DoughStockSchema = new mongoose.Schema({
  type: { type: String, enum: ['normal', 'gf'], required: true, unique: true },
  stock: { type: Number, default: 0 },
  outOfStock: { type: Boolean, default: false }
});

module.exports = mongoose.model('DoughStock', DoughStockSchema);
