
const mongoose = require('mongoose');
require('dotenv').config();

const Topping = require('./topping.model');

const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const mongoUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const toppings = [
  { name: 'Pepperoni', category: 'Meat', price: 1 },
  { name: 'Sausage', category: 'Meat', price: 1 },
  { name: 'Bacon', category: 'Meat', price: 1 },
  { name: 'Ham', category: 'Meat', price: 1 },
  { name: 'Mushrooms', category: 'Veg', price: 1 },
  { name: 'Onions', category: 'Veg', price: 1 },
  { name: 'Black olives', category: 'Veg', price: 1 },
  { name: 'Green peppers', category: 'Veg', price: 1 },
  { name: 'Pineapple', category: 'Veg', price: 1 },
  { name: 'Spinach', category: 'Veg', price: 1 },
  { name: 'Extra cheese', category: 'Other', price: 1 }
];

async function seedToppings() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  await Topping.deleteMany({});
  await Topping.insertMany(toppings);
  console.log('Toppings seeded!');
  await mongoose.connection.close();
}

seedToppings();
