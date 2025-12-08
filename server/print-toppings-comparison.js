// Script to print all master toppings and all menu item toppings for comparison
require('dotenv').config();
const mongoose = require('mongoose');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const MenuItem = require('./menu-item.model');
const Topping = require('./topping.model');

async function printToppingsComparison() {
  await mongoose.connect(atlasUri);
  const items = await MenuItem.find({});
  const masterToppings = await Topping.find({});
  console.log('--- Master Toppings ---');
  masterToppings.forEach(t => console.log(t.name));
  console.log('\n--- Menu Item Toppings ---');
  items.forEach(item => {
    console.log(item.name + ':', item.toppings);
  });
  await mongoose.disconnect();
  console.log('Done.');
}

printToppingsComparison();
