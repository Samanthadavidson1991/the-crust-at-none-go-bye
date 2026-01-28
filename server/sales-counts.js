// sales-counts.js
// Express route for sales counts per menu item

const express = require('express');
const router = express.Router();
const Order = require('./order.model');

// GET /api/sales-counts
router.get('/', async (req, res) => {
  try {
    // Aggregate sales by item name
    const results = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } }
    ]);
    const sales = results.map(r => ({ name: r._id, count: r.count }));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
