const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  section: String,
  description: String,
  price: Number,
  toppings: [String],
  sizes: Array,
  sideOptions: Array,
  glutenFree: Boolean,
  stock: Number,
  showsToppings: { type: Boolean, default: false }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
