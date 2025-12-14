const express = require('express');
const router = express.Router();
const SectionTopping = require('./section-toppings.model');

// Get all section toppings
router.get('/', async (req, res) => {
  const toppings = await SectionTopping.find();
  res.json({ toppings });
});

// Get toppings for a section
router.get('/:section', async (req, res) => {
  const doc = await SectionTopping.findOne({ section: req.params.section });
  if (!doc) return res.json({ toppings: [], masterPrices: { veg: 0, meat: 0 } });
  res.json(doc);
});

// Set master prices for a section
router.post('/:section/master-prices', async (req, res) => {
  const { veg, meat } = req.body;
  let doc = await SectionTopping.findOne({ section: req.params.section });
  if (!doc) {
    doc = new SectionTopping({ section: req.params.section, masterPrices: { veg, meat }, toppings: [] });
  } else {
    doc.masterPrices.veg = veg;
    doc.masterPrices.meat = meat;
  }
  await doc.save();
  res.json(doc);
});

// Add a topping to a section
router.post('/:section/toppings', async (req, res) => {
  const { name, category, price } = req.body;
  let doc = await SectionTopping.findOne({ section: req.params.section });
  if (!doc) {
    doc = new SectionTopping({ section: req.params.section, masterPrices: { veg: 0, meat: 0 }, toppings: [] });
  }
  // For Veg/Meat, price is ignored and will be set from masterPrices
  const topping = { name, category };
  if (category === 'Other') topping.price = price;
  doc.toppings.push(topping);
  await doc.save();
  res.json(doc);
});

// Delete a topping from a section
router.delete('/:section/toppings/:name', async (req, res) => {
  const doc = await SectionTopping.findOne({ section: req.params.section });
  if (!doc) return res.status(404).json({ error: 'Section not found' });
  doc.toppings = doc.toppings.filter(t => t.name !== req.params.name);
  await doc.save();
  res.json(doc);
});

// Update a topping (for 'Other' price)
router.patch('/:section/toppings/:name', async (req, res) => {
  const { price } = req.body;
  const doc = await SectionTopping.findOne({ section: req.params.section });
  if (!doc) return res.status(404).json({ error: 'Section not found' });
  const topping = doc.toppings.find(t => t.name === req.params.name);
  if (!topping) return res.status(404).json({ error: 'Topping not found' });
  if (topping.category === 'Other') topping.price = price;
  await doc.save();
  res.json(doc);
});

module.exports = router;
