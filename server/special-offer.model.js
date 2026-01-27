// This is a Mongoose schema for special offers with new fields for description, up to 4 included sections, price, start/end dates, and voucher codes.
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: String,
  desc: String, // main offer wording
  sections: [String], // up to 4 sections (e.g. 'Pizzas', 'Sides')
  blockedItems: [[String]], // Array of arrays: blockedItems[i] = array of item IDs blocked for sections[i]
  extraPrices: [{ type: Map, of: Number }], // Array of maps: extraPrices[i][itemId] = extra price for item in sections[i]
  price: Number,
  startDate: Date,
  endDate: Date,
  voucherCodes: [String]
});

module.exports = mongoose.model('SpecialOffer', offerSchema);