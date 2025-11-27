// Express router for managing vouchers
const express = require('express');
const router = express.Router();
const Voucher = require('./voucher.model');
const SpecialOffer = require('./special-offer.model');

// Generate a new voucher code (random alphanumeric)
function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a voucher for an offer
router.post('/generate', async (req, res) => {
  const { offerId, expiresInDays, price } = req.body;
  if (!offerId) return res.status(400).json({ error: 'Offer required' });
  const offer = await SpecialOffer.findById(offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  const code = generateCode();
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined;
  const voucher = new Voucher({ code, offer: offer._id, expiresAt, price: price ? Number(price) : undefined });
  await voucher.save();
  res.json({ success: true, voucher });
});

// List all vouchers (optionally for an offer)
router.get('/', async (req, res) => {
  const { offerId } = req.query;
  const query = offerId ? { offer: offerId } : {};
  const vouchers = await Voucher.find(query).populate('offer').sort({ createdAt: -1 });
  res.json(vouchers);
});

// Mark voucher as used
router.post('/use', async (req, res) => {
  const { code, usedBy } = req.body;
  const voucher = await Voucher.findOne({ code });
  if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
  if (voucher.used) return res.status(400).json({ error: 'Voucher already used' });
  voucher.used = true;
  voucher.usedAt = new Date();
  voucher.usedBy = usedBy;
  await voucher.save();
  res.json({ success: true, voucher });
});

module.exports = router;
