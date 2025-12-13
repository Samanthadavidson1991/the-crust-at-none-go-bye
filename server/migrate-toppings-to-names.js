// Migration script: Convert ObjectId toppings to names in menu items and sections
const mongoose = require('mongoose');
require('dotenv').config();

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const MenuItem = require('./menu-item.model');
const Section = require('./section.model');
const Topping = require('./topping.model');

async function migrateToppingsToNames() {
  await mongoose.connect(atlasUri);

  // Build a lookup of topping ObjectId to name
  const toppings = await Topping.find({});
  const toppingMap = {};
  toppings.forEach(t => toppingMap[t._id.toString()] = t.name);

  // Update menu items
  const items = await MenuItem.find({});
  for (const item of items) {
    if (item.toppings && item.toppings.length > 0) {
      let changed = false;
      const newToppings = item.toppings.map(t => {
        if (typeof t === 'string') return t;
        if (t && t._id && toppingMap[t._id.toString()]) {
          changed = true;
          return toppingMap[t._id.toString()];
        }
        if (t && toppingMap[t.toString()]) {
          changed = true;
          return toppingMap[t.toString()];
        }
        return t;
      });
      if (changed) {
        item.toppings = newToppings;
        await item.save();
        console.log('Updated menu item:', item.name, newToppings);
      }
    }
  }

  // Update sections
  const sections = await Section.find({});
  for (const section of sections) {
    if (section.toppings && section.toppings.length > 0) {
      let changed = false;
      const newToppings = section.toppings.map(t => {
        if (typeof t === 'string') return t;
        if (t && t._id && toppingMap[t._id.toString()]) {
          changed = true;
          return toppingMap[t._id.toString()];
        }
        if (t && toppingMap[t.toString()]) {
          changed = true;
          return toppingMap[t.toString()];
        }
        return t;
      });
      if (changed) {
        section.toppings = newToppings;
        await section.save();
        console.log('Updated section:', section.name, newToppings);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrateToppingsToNames();
