// Script to delete all menu items from the database
const mongoose = require('mongoose');
require('dotenv').config();

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const MenuItem = require('./menu-item.model');

async function deleteAllMenuItems() {
  await mongoose.connect(atlasUri);
  const result = await MenuItem.deleteMany({});
  console.log('Deleted menu items:', result.deletedCount);
  await mongoose.disconnect();
}

deleteAllMenuItems();
