import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect('mongodb://localhost:27017/pizzaShop', { useNewUrlParser: true, useUnifiedTopology: true });

const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  section: String,
  description: String,
  price: Number,
  toppings: [String],
  sizes: Array,
  sideOptions: Array,
  glutenFree: Boolean,
  stock: Number
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Load menu-clean.json
const menuPath = path.resolve(__dirname, '../menu-clean.json');
let menuArr = [];
try {
  const raw = fs.readFileSync(menuPath, 'utf-8');
  menuArr = JSON.parse(raw);
} catch (e) {
  // Failed to load menu-clean.json
  process.exit(1);
}

// Map section to category and vice versa for compatibility
const initialMenu = menuArr.map(item => {
  const section = item.section || item.category || 'Other';
  const category = item.category || item.section || 'Other';
  return {
    ...item,
    section,
    category
  };
});

async function seedMenu() {
  await MenuItem.deleteMany({});
  await MenuItem.insertMany(initialMenu);
  // Menu seeded from menu-clean.json
  mongoose.connection.close();
}

seedMenu();
