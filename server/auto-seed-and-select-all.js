// Automated menu seeder and live menu selector
// Usage: node server/auto-seed-and-select-all.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;
const menuPath = path.resolve(__dirname, '../menu-clean.json');
const selectedSetsPath = path.resolve(__dirname, '../server/selected-menu-sets.json');

const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  section: String,
  description: String,
  price: Number,
  toppings: [String],
  saladToppings: [String],
  sizes: Array,
  sideOptions: Array,
  glutenFree: Boolean,
  stock: Number,
  stockAmount: { type: Number, required: false },
  showsToppings: { type: Boolean, default: false },
  allowMasterToppings: { type: Boolean, default: false },
  allowAddToppings: { type: Boolean, default: false },
  allowRemoveToppings: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false }
});
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

(async () => {
  // 1. Seed database from menu-clean.json
  let menuArr = [];
  try {
    const raw = fs.readFileSync(menuPath, 'utf-8');
    menuArr = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load menu-clean.json:', e);
    process.exit(1);
  }
  const initialMenu = menuArr.map(item => {
    const section = item.section || item.category || 'Other';
    const category = item.category || item.section || 'Other';
    return {
      ...item,
      section,
      category,
      toppings: Array.isArray(item.toppings) ? item.toppings : [],
      saladToppings: Array.isArray(item.saladToppings) ? item.saladToppings : [],
      allowMasterToppings: true,
      allowAddToppings: true,
      allowRemoveToppings: true,
    };
  });
  await mongoose.connect(atlasUri);
  await MenuItem.deleteMany({});
  await MenuItem.insertMany(initialMenu);
  console.log('Database seeded from menu-clean.json.');

  // 2. Update selected-menu-sets.json with all items, all sizes
  const allSets = [];
  for (const item of initialMenu) {
    const section = item.section || item.category || 'Other';
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      for (const sizeObj of item.sizes) {
        allSets.push({ section, item: item.name, size: sizeObj.name });
      }
    } else {
      // If no sizes, use 'default' or blank
      allSets.push({ section, item: item.name, size: '' });
    }
  }
  fs.writeFileSync(selectedSetsPath, JSON.stringify(allSets, null, 2));
  console.log('selected-menu-sets.json updated with all items and sizes.');
  await mongoose.disconnect();
  console.log('All done!');
})();
