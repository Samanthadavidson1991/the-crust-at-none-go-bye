import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/pizzaShop');

const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  price: Number,
  toppings: [String],
  sizes: Array,
  sideOptions: Array,
  glutenFree: Boolean,
  stock: Number
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

const sampleItem = {
  name: 'Sample Supreme Pizza',
  category: 'Pizza',
  description: 'A sample pizza with all the classic toppings.',
  price: 14.99,
  toppings: ['Pepperoni', 'Mushrooms', 'Onions', 'Green peppers', 'Black olives', 'Extra cheese'],
  sizes: [
    { name: '12in', price: 14.99 },
    { name: '8in', price: 9.99 },
    { name: 'Gluten Free', price: 15.99 }
  ],
  sideOptions: ['Garlic Bread', 'Salad'],
  glutenFree: false,
  stock: 12
};

async function addSampleMenuItem() {
  await MenuItem.create(sampleItem);
  // Sample menu item added!
  mongoose.connection.close();
}

addSampleMenuItem();
