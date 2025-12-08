require('dotenv').config();
const mongoose = require('mongoose');
const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;
const MenuItem = require('./menu-item.model');

(async () => {
  await mongoose.connect(atlasUri);
  const res = await MenuItem.updateMany({ category: 'Pizza' }, { $set: { showsToppings: true } });
  console.log('Updated menu items:', res.modifiedCount);
  await mongoose.disconnect();
})();
