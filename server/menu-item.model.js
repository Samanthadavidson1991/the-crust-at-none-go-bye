const mongoose = require('mongoose');

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
  showsToppings: { type: Boolean, default: false },
  allowMasterToppings: { type: Boolean, default: false }
});

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
  showsToppings: { type: Boolean, default: false },
  allowMasterToppings: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false } // For temporary hiding
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
