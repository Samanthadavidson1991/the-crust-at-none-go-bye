import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/pizzaShop', { useNewUrlParser: true, useUnifiedTopology: true });

const toppingStockSchema = new mongoose.Schema({
  topping: String,
  outOfStock: Boolean,
  type: { type: String, enum: ['meat', 'vegetable'], required: true }
});
const ToppingStock = mongoose.model('ToppingStock', toppingStockSchema);

const initialToppings = [
  { topping: 'Pepperoni', outOfStock: false, type: 'meat' },
  { topping: 'Sausage', outOfStock: false, type: 'meat' },
  { topping: 'Bacon', outOfStock: false, type: 'meat' },
  { topping: 'Ham', outOfStock: false, type: 'meat' },
  { topping: 'Mushrooms', outOfStock: false, type: 'vegetable' },
  { topping: 'Onions', outOfStock: false, type: 'vegetable' },
  { topping: 'Black olives', outOfStock: false, type: 'vegetable' },
  { topping: 'Green peppers', outOfStock: false, type: 'vegetable' },
  { topping: 'Pineapple', outOfStock: false, type: 'vegetable' },
  { topping: 'Spinach', outOfStock: false, type: 'vegetable' },
  { topping: 'Extra cheese', outOfStock: false, type: 'vegetable' }
];

async function seedToppings() {
  await ToppingStock.deleteMany({});
  await ToppingStock.insertMany(initialToppings);
  // Topping stock seeded!
  mongoose.connection.close();
}

seedToppings();
