const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: String,
  items: [
    {
      name: String,
      quantity: Number
    }
  ],
  timeSlot: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
