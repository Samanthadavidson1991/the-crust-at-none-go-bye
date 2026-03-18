const mongoose = require('mongoose');

const ToppingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['Meat', 'Veg', 'Other'], required: true },
  price: { type: Number, required: true, default: 0 }
});

module.exports = mongoose.model('Topping', ToppingSchema);