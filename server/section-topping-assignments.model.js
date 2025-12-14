const mongoose = require('mongoose');

const SectionToppingAssignmentSchema = new mongoose.Schema({
  section: { type: String, required: true, unique: true },
  toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MasterTopping' }]
});

module.exports = mongoose.model('SectionToppingAssignment', SectionToppingAssignmentSchema);
