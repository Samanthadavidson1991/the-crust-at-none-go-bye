// Model for storing selected menu sets for live menu display
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, 'selected-menu-sets.json');

function getSelectedMenuSets() {
  if (!fs.existsSync(DATA_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function saveSelectedMenuSets(sets) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(sets, null, 2), 'utf8');
}

module.exports = { getSelectedMenuSets, saveSelectedMenuSets };
