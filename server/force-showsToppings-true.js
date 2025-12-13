require('dotenv').config();
const mongoose = require('mongoose');
const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;
const MenuItem = require('./menu-item.model');

(async () => {
  await mongoose.connect(atlasUri);
  const items = await MenuItem.find({});
  let updated = 0;
  for (const item of items) {
    if (!item.showsToppings) {
      item.showsToppings = true;
      await item.save();
      updated++;
    }
  }
  console.log('Updated menu items:', updated);
  await mongoose.disconnect();
})();
