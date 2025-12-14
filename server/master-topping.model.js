const mongoose = require('mongoose');

const MasterToppingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['Meat', 'Veg', 'Other'], required: true },
  price: { type: Number, required: function() { return this.category === 'Other'; } }, // Only required for 'Other'
});

const MasterTopping = mongoose.model('MasterTopping', MasterToppingSchema);

const MasterToppingSettingsSchema = new mongoose.Schema({
  masterMeatPrice: { type: Number, default: 0 },
  masterVegPrice: { type: Number, default: 0 },
});

const MasterToppingSettings = mongoose.model('MasterToppingSettings', MasterToppingSettingsSchema);

module.exports = { MasterTopping, MasterToppingSettings };
