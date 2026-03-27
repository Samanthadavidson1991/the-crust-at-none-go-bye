
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(atlasUri);

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
  hidden: { type: Boolean, default: false }
});
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

// Load menu-clean.json
const menuPath = path.resolve(__dirname, '../menu-clean.json');
let menuArr = [];
try {
  const raw = fs.readFileSync(menuPath, 'utf-8');
  menuArr = JSON.parse(raw);
} catch (e) {
  // Failed to load menu-clean.json
  console.error('Failed to load menu-clean.json:', e);
  process.exit(1);
}

// Map section to category and vice versa for compatibility
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

// Remove all existing menu items and insert initial menu
async function seedMenu() {
  await MenuItem.deleteMany({});
  await MenuItem.insertMany(initialMenu);
  console.log('Menu seeded!');
  await mongoose.connection.close();
}

// Only one export and one function definition
module.exports = seedMenu;
