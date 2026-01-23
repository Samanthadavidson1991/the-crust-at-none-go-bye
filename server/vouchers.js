// Delete a voucher by ID or code
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  let result = null;
  // Try by MongoDB _id first
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    result = await Voucher.findByIdAndDelete(id);
  }
  // If not found, try by code
  if (!result) {
    result = await Voucher.findOneAndDelete({ code: id });
  }
  if (!result) return res.status(404).json({ error: 'Voucher not found' });
  res.json({ success: true });
});
// Express router for managing vouchers
const express = require('express');
const router = express.Router();
const Voucher = require('./voucher.model');
const SpecialOffer = require('./special-offer.model');

// Create a voucher with just a name (no offer required)
router.post('/generate-name', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const code = generateCode();
  const voucher = new Voucher({ code, name });
  await voucher.save();
  res.json({ success: true, voucher });
});

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
  const { offerId, expiresInDays, price, name, startDate, expiryDate } = req.body;
  let offer = null;
  if (offerId) {
    offer = await SpecialOffer.findById(offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
  }
  const code = generateCode();
  let expiresAt;
  if (expiryDate) {
    expiresAt = new Date(expiryDate);
  } else if (expiresInDays) {
    expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  }
  let createdAt;
  if (startDate) {
    createdAt = new Date(startDate);
  }
  const voucherData = {
    code,
    expiresAt,
    price: price ? Number(price) : undefined,
    name
  };
  if (createdAt) voucherData.createdAt = createdAt;
  if (offer) voucherData.offer = offer._id;
  const voucher = new Voucher(voucherData);
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
