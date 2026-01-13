// Express router for saving and retrieving selected menu sets
const express = require('express');
const router = express.Router();
const { getSelectedMenuSets, saveSelectedMenuSets } = require('./selected-menu-sets.model');

// GET selected sets
router.get('/', (req, res) => {
  res.json({ sets: getSelectedMenuSets() });
});

// POST selected sets
router.post('/', (req, res) => {
  const sets = req.body.sets;
  if (!Array.isArray(sets) || sets.length > 4) {
    return res.status(400).json({ error: 'Invalid sets array' });
  }
  saveSelectedMenuSets(sets);
  res.json({ success: true });
});

module.exports = router;
