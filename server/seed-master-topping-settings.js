// Seed master topping settings with default prices including salad
const mongoose = require('mongoose');
require('dotenv').config();
const { MasterToppingSettings } = require('./master-topping.model');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const mongoUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

async function seedMasterToppingSettings() {
  await mongoose.connect(mongoUri);
  await MasterToppingSettings.deleteMany({});
  await MasterToppingSettings.create({
    masterMeatPrice: 1.2,
    masterVegPrice: 0.8,
    masterSaladPrice: 0.6
  });
  console.log('Master topping settings seeded!');
  await mongoose.connection.close();
}

seedMasterToppingSettings();
