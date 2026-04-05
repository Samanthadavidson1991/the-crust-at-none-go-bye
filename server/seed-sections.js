// Usage: node server/seed-sections.js
// This script will seed your MongoDB with the correct section names for your menu.
require('dotenv').config();
const mongoose = require('mongoose');
const Section = require('./section.model');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

// List your real section names here:
const sections = [
  { name: 'Pizza', order: 1 },
  { name: 'Salad', order: 2 },
  // Add more sections as needed
];

(async () => {
  await mongoose.connect(atlasUri);
  await Section.deleteMany({});
  await Section.insertMany(sections);
  console.log('Sections seeded:', sections.map(s => s.name));
  await mongoose.disconnect();
})();
