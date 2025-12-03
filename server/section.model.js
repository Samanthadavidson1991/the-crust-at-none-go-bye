const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
