// This is a Mongoose schema for special offers with new fields for description, up to 4 included sections, price, start/end dates, and voucher codes.
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: String,
  desc: String, // main offer wording
  sections: [String], // up to 4 sections (e.g. 'Pizzas', 'Sides')
  offerItems: [
    {
      section: String,
      itemId: String,
      extra: Number,
      sizes: [
        {
          name: String,
          extra: Number
        }
      ]
    }
  ],
  price: Number,
  startDate: Date,
  endDate: Date,
  voucherCodes: [String]
});

module.exports = mongoose.model('SpecialOffer', offerSchema);