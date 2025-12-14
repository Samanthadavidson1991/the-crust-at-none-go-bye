const mongoose = require('mongoose');

const SectionToppingSchema = new mongoose.Schema({
  section: { type: String, required: true },
  masterPrices: {
    veg: { type: Number, default: 0 },
    meat: { type: Number, default: 0 }
  },
  toppings: [
    {
      name: { type: String, required: true },
      category: { type: String, enum: ['Veg', 'Meat', 'Other'], required: true },
      price: { type: Number }, // Only used for 'Other', ignored for Veg/Meat
    }
  ]
});

module.exports = mongoose.model('SectionTopping', SectionToppingSchema);
