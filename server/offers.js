// Express router for managing special offers
const express = require('express');
const router = express.Router();
const SpecialOffer = require('./special-offer.model');

// Get all offers
router.get('/', async (req, res) => {
  const offers = await SpecialOffer.find().sort({ startDate: -1 });
  res.json(offers);
});

// Add a new offer
router.post('/', async (req, res) => {
  const { title, desc, sections, offerItems, price, startDate, endDate, voucherCodes } = req.body;
  if (!title || !desc) return res.status(400).json({ error: 'Title and description required.' });
  const offer = new SpecialOffer({
    title,
    desc,
    sections: Array.isArray(sections) ? sections.slice(0, 4) : [],
    offerItems: Array.isArray(offerItems) ? offerItems : [],
    price: price ? Number(price) : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    voucherCodes: Array.isArray(voucherCodes) ? voucherCodes : []
  });
  await offer.save();
  res.json({ success: true, offer });
});

// Delete an offer by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const offer = await SpecialOffer.findByIdAndDelete(id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  res.json({ success: true });
});

// Validate voucher code
router.post('/validate-voucher', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  const offer = await SpecialOffer.findOne({ voucherCodes: code });
  if (!offer) return res.status(404).json({ error: 'Invalid voucher code' });
  res.json({ valid: true, offer });
});

module.exports = router;
