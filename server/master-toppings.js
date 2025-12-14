const express = require('express');
const router = express.Router();
const { MasterTopping, MasterToppingSettings } = require('./master-topping.model');
const SectionToppingAssignment = require('./section-topping-assignments.model');

// Get all master toppings and settings
router.get('/', async (req, res) => {
  const toppings = await MasterTopping.find();
  let settings = await MasterToppingSettings.findOne();
  if (!settings) settings = await MasterToppingSettings.create({});
  res.json({ toppings, settings });
});

// Add a master topping
router.post('/', async (req, res) => {
  const { name, category, price } = req.body;
  const topping = new MasterTopping({ name, category, price: category === 'Other' ? price : undefined });
  await topping.save();
  res.json(topping);
});

// Delete a master topping
router.delete('/:id', async (req, res) => {
  await MasterTopping.findByIdAndDelete(req.params.id);
  // Remove from all section assignments
  await SectionToppingAssignment.updateMany({}, { $pull: { toppings: req.params.id } });
  res.json({ success: true });
});

// Update master prices
router.post('/settings', async (req, res) => {
  const { masterMeatPrice, masterVegPrice } = req.body;
  let settings = await MasterToppingSettings.findOne();
  if (!settings) settings = new MasterToppingSettings();
  settings.masterMeatPrice = masterMeatPrice;
  settings.masterVegPrice = masterVegPrice;
  await settings.save();
  res.json(settings);
});

module.exports = router;
