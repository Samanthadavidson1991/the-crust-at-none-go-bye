const mongoose = require('mongoose');
const MenuItem = require('./menu-item.model');
require('dotenv').config({ path: __dirname + '/.env' });

console.log('User:', process.env.MONGO_ATLAS_USERNAME);
console.log('Password:', process.env.MONGO_ATLAS_PASSWORD);

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(atlasUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await MenuItem.deleteMany({});
    console.log('All menu items removed:', result.deletedCount);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
