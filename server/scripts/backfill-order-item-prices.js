// Script to backfill missing prices in order items using current menu prices
// Usage: node scripts/backfill-order-item-prices.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Order = require('../order.model');
const MenuItem = require('../menu-item.model');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

async function main() {
  await mongoose.connect(atlasUri);
  console.log('Connected to MongoDB');

  // Build a lookup of menu item prices by name
  const menu = await MenuItem.find({});
  const priceMap = {};
  for (const item of menu) {
    priceMap[item.name.trim().toUpperCase()] = item.price;
  }

  const orders = await Order.find({ 'items.price': { $exists: false } });
  let updatedCount = 0;
  for (const order of orders) {
    let changed = false;
    for (const item of order.items) {
      if (typeof item.price === 'undefined') {
        const key = item.name.trim().toUpperCase();
        if (priceMap[key] !== undefined) {
          item.price = priceMap[key];
          changed = true;
        } else {
          console.warn(`No price found for item: ${item.name} (order ${order._id})`);
        }
      }
    }
    if (changed) {
      await order.save();
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} orders with missing item prices.`);
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
