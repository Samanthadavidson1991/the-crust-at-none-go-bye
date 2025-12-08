// Script to add all unique toppings used in menu items to the master toppings collection
require('dotenv').config();
const mongoose = require('mongoose');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const MenuItem = require('./menu-item.model');
const Topping = require('./topping.model');

async function syncMenuToppingsToMaster() {
  await mongoose.connect(atlasUri);
  const items = await MenuItem.find({});
  const allToppingNames = new Set();
  items.forEach(item => {
    (item.toppings || []).forEach(t => allToppingNames.add(t));
  });
  const masterToppings = await Topping.find({});
  const masterNames = new Set(masterToppings.map(t => t.name));
  let added = 0;
  for (const name of allToppingNames) {
    if (!masterNames.has(name)) {
      await Topping.create({ name, category: 'Other', price: 0 });
      console.log('Added to master toppings:', name);
      added++;
    }
  }
  await mongoose.disconnect();
  console.log(`Sync complete. ${added} new toppings added.`);
}

syncMenuToppingsToMaster();
