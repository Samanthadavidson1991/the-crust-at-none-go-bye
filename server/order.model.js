const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: String,
  paymentType: String,
  source: String,
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      size: String,
      toppings: [String],
      removed: [String],
      notes: String
    }
  ],
  timeSlot: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
