// Mongoose schema for voucher codes with tracking and expiry
const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'SpecialOffer' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
  usedBy: { type: String }, // Optionally store user/email
  price: { type: Number } // Discount or price for this voucher
});

module.exports = mongoose.model('Voucher', voucherSchema);