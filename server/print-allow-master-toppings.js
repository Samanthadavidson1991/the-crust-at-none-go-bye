// Script to print all menu items and their allowMasterToppings status
require('dotenv').config();
const mongoose = require('mongoose');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const MenuItem = require('./menu-item.model');

async function printAllowMasterToppings() {
  await mongoose.connect(atlasUri);
  const items = await MenuItem.find({});
  items.forEach(item => {
    console.log(`${item.name}: allowMasterToppings = ${item.allowMasterToppings}`);
  });
  await mongoose.disconnect();
  console.log('Done.');
}

printAllowMasterToppings();
