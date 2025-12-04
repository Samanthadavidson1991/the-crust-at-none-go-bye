const mongoose = require('mongoose');

const ToppingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Topping', ToppingSchema);