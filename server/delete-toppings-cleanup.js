// Script to delete all toppings collections and remove toppings fields from menu items
require('dotenv').config();
const mongoose = require('mongoose');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const mongoUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

async function runCleanup() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;

  // Drop toppings collections if they exist
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    if (/topping/i.test(col.name)) {
      console.log(`Dropping collection: ${col.name}`);
      await db.dropCollection(col.name);
    }
  }

  // Remove toppings and showsToppings fields from all menu items
  const menuItems = db.collection('menuitems');
  const updateResult = await menuItems.updateMany({}, { $unset: { toppings: "", showsToppings: "" } });
  console.log(`Removed toppings fields from ${updateResult.modifiedCount} menu items.`);

  await mongoose.disconnect();
  console.log('Cleanup complete.');
}

runCleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
