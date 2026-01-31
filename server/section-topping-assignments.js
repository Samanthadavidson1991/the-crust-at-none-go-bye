const express = require('express');
const router = express.Router();
const SectionToppingAssignment = require('./section-topping-assignments.model');
const { MasterTopping } = require('./master-topping.model');

// Get all section assignments
router.get('/', async (req, res) => {
  try {
    const docs = await SectionToppingAssignment.find({}).populate('toppings');
    res.json({ sections: docs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch section assignments', details: err.message });
  }
});

// Get toppings assigned to a section
router.get('/:section', async (req, res) => {
  const doc = await SectionToppingAssignment.findOne({ section: req.params.section }).populate('toppings');
  res.json(doc || { section: req.params.section, toppings: [] });
});

// Assign toppings to a section (replace all)
router.post('/:section', async (req, res) => {
  const { toppingIds } = req.body; // Array of MasterTopping _id
  let doc = await SectionToppingAssignment.findOne({ section: req.params.section });
  if (!doc) doc = new SectionToppingAssignment({ section: req.params.section, toppings: [] });
  doc.toppings = toppingIds;
  await doc.save();
  res.json(doc);
});

module.exports = router;
