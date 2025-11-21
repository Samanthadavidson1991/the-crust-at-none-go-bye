require('dotenv').config();

// --- REFUND ENDPOINT ---
// (Moved below app initialization)
// ...existing code...



const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
if (!process.env.PORT) {
  throw new Error('PORT environment variable is required. This app must be run with process.env.PORT set (e.g., by Render).');
}
const PORT = process.env.PORT;


app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// Serve static files from the public directory
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- SESSION CONFIGURATION ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretkey';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false }
}));

function requireAdminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin logout endpoint
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// --- DELIVERY DISTANCE CONFIG SCHEMA ---
const deliveryDistanceSchema = new mongoose.Schema({
  miles: { type: Number, default: 5 }
});
const DeliveryDistance = mongoose.model('DeliveryDistance', deliveryDistanceSchema);
// --- DELIVERY DISTANCE ENDPOINTS ---
app.get('/api/delivery-distance', async (req, res) => {
  let doc = await DeliveryDistance.findOne();
  if (!doc) doc = await DeliveryDistance.create({ miles: 5 });
  res.json({ miles: doc.miles });
});
app.post('/api/delivery-distance', async (req, res) => {
  let doc = await DeliveryDistance.findOne();
  const miles = typeof req.body.miles === 'number' ? req.body.miles : 5;
  if (!doc) doc = await DeliveryDistance.create({ miles });
  else { doc.miles = miles; await doc.save(); }
  res.json({ message: 'Saved', miles: doc.miles });
});

// --- SCHEMAS & MODELS ---
// Opening times schema/model
const openingTimesSchema = new mongoose.Schema({
  friday: { open: String, close: String },
  saturday: { open: String, close: String },
  sunday: { open: String, close: String }
});
const OpeningTimes = mongoose.model('OpeningTimes', openingTimesSchema);

// Time slot schema/model
const timeSlotSchema = new mongoose.Schema({
  time: String,
  doughLimit: { type: Number, default: 0 },
  deliveryAmount: { type: Number, default: 0 }
});
const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

// Pizza Topping stock schema/model
const pizzaToppingStockSchema = new mongoose.Schema({
  topping: String,
  outOfStock: Boolean,
  type: String,
  price: Number
});
const PizzaToppingStock = mongoose.model('PizzaToppingStock', pizzaToppingStockSchema);

// Salad Topping stock schema/model
const saladToppingStockSchema = new mongoose.Schema({
  topping: String,
  outOfStock: Boolean,
  type: String,
  price: Number
});
const SaladToppingStock = mongoose.model('SaladToppingStock', saladToppingStockSchema);

// Menu item schema/model
const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  price: Number,
  toppings: [String],
  sizes: Array,
  sideOptions: Array,
  glutenFree: Boolean,
  stock: Number,
  doughTracked: { type: Boolean, default: false },
  gfDoughTracked: { type: Boolean, default: false }
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Normal dough stock schema/model
const doughStockSchema = new mongoose.Schema({
  stock: { type: Number, default: 0 }
});
const DoughStock = mongoose.model('DoughStock', doughStockSchema);

// Gluten free dough stock schema/model
const gfDoughStockSchema = new mongoose.Schema({
  stock: { type: Number, default: 0 }
});
const GFDoughStock = mongoose.model('GFDoughStock', gfDoughStockSchema);

// --- ORDER SCHEMA & MODEL ---
const orderSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' },
  name: String, // Customer name
  type: { type: String, enum: ['Delivery', 'Collection'], default: 'Delivery' },
  timeSlot: String, // Human-readable time slot
  address: {
    full: String, // Full address string
    postcode: String,
    email: String
  },
  items: [
    {
      name: String,
      size: String,
      quantity: Number,
      price: Number,
      notes: String,
      toppings: [String], // included ingredients
      removed: [String]   // removed ingredients
    }
  ],
  paymentType: { type: String, default: 'card' },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  customerNotes: { type: String, default: '' },
  allergens: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
  refundDate: { type: Date },
  refundReason: { type: String }
});
const Order = mongoose.model('Order', orderSchema);

// --- MONGODB CONNECTION (Atlas, automated password) ---


const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
// console.log('MongoDB user:', dbUser, 'password:', dbPassword); // Removed for production
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(atlasUri)
  .then(() => { /* MongoDB connected */ })
  .catch(err => {
    /* MongoDB connection error */
    process.exit(1);
  });


// Removed uncaughtException and unhandledRejection logging for production

// --- IN-MEMORY DOUGH TRACKING ---
let doughTrackedItems = [];
let gfDoughTrackedItems = [];

// --- ROUTES ---
// Place an order for a slot, enforcing dough/delivery limits
app.post('/api/orders', async (req, res) => {
  const { slotId, name, type, address, items, status, customerNotes, allergens, paymentType } = req.body;
  if (!slotId) return res.status(400).json({ error: 'slotId required' });
  // console.log('Received order:', req.body); // Removed for production
  let slot = null;
  try {
    slot = await TimeSlot.findById(slotId);
  } catch (e) {
    // Not a valid ObjectId, try to find by time string
    slot = await TimeSlot.findOne({ time: slotId });
  }
  if (!slot) {
    // Slot not found for slotId
    // Fallback: allow order to be saved with slotId as null and timeSlot as string
    const order = new Order({
      slotId: null,
      name: name || '',
      type: type || 'Delivery',
      timeSlot: slotId,
      address: { ...address },
      items: Array.isArray(items) ? items : [],
      paymentType: paymentType || 'card',
      status: status || 'Pending',
      customerNotes: customerNotes || '',
      allergens: allergens || ''
    });
    await order.save();
    // Order saved with fallback slot
    return res.status(201).json({ message: 'Order placed (fallback slot)', order });
  }
  // Count existing orders for this slot
  const orderCount = await Order.countDocuments({ slotId });
  const maxAllowed = Math.min(slot.doughLimit || 0, slot.deliveryAmount || 0);
  if (maxAllowed === 0) return res.status(400).json({ error: 'Slot not available (limits are zero)' });
  if (orderCount >= maxAllowed) {
    // Find next available slot
    const allSlots = await TimeSlot.find({}).sort({ time: 1 });
    let found = null;
    for (let s of allSlots) {
      if (String(s._id) === String(slotId)) continue;
      const c = await Order.countDocuments({ slotId: s._id });
      const max = Math.min(s.doughLimit || 0, s.deliveryAmount || 0);
      if (max > 0 && c < max) {
        found = s;
        break;
      }
    }
    if (found) {
      return res.status(409).json({ error: 'Slot full', nextAvailable: { id: found._id, time: found.time } });
    } else {
      return res.status(409).json({ error: 'All slots full' });
    }
  }
  // Place order
  const order = new Order({
    slotId,
    name: name || '',
    type: type || 'Delivery',
    timeSlot: slot.time,
    address: address || {},
    items: Array.isArray(items) ? items : [],
    paymentType: paymentType || 'card',
    status: status || 'Pending',
    customerNotes: customerNotes || '',
    allergens: allergens || ''
  });
  await order.save();

  // Block the next slot
  // Get all slots sorted by time
  const allSlots = await TimeSlot.find({}).sort({ time: 1 });
  const idx = allSlots.findIndex(s => String(s._id) === String(slotId));
  if (idx >= 0 && idx < allSlots.length - 1) {
    const nextSlot = allSlots[idx + 1];
    // Set deliveryAmount and doughLimit to zero to block it
    await TimeSlot.findByIdAndUpdate(nextSlot._id, { deliveryAmount: 0, doughLimit: 0 });
  }

  res.status(201).json({ message: 'Order placed', order });
});

// Get all orders for admin
// Get all orders for admin, with optional date filter (YYYY-MM-DD)
app.get('/api/orders', async (req, res) => {
  const { date } = req.query;
  let query = {};
  if (date) {
    // Filter orders by date (createdAt between start and end of day)
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    query.createdAt = { $gte: start, $lte: end };
  }
  const orders = await Order.find(query).sort({ createdAt: -1 });
  res.json(orders);
});

// Get order counts per customer name
app.get('/api/order-counts', async (req, res) => {
  // Group by name, count
  const counts = await Order.aggregate([
    { $group: { _id: { $toLower: "$name" }, count: { $sum: 1 } } }
  ]);
  // Convert to { name: count } object
  const result = {};
  counts.forEach(c => {
    if (c._id) result[c._id] = c.count;
  });
  res.json(result);
});
// Opening times
app.get('/api/opening-times', async (req, res) => {
  let doc = await OpeningTimes.findOne();
  if (!doc) doc = await OpeningTimes.create({ friday: {}, saturday: {}, sunday: {} });
  res.json({ friday: doc.friday, saturday: doc.saturday, sunday: doc.sunday });
});
app.post('/api/opening-times', async (req, res) => {
  let doc = await OpeningTimes.findOne();
  if (!doc) doc = await OpeningTimes.create(req.body);
  else {
    doc.friday = req.body.friday;
    doc.saturday = req.body.saturday;
    doc.sunday = req.body.sunday;
    await doc.save();
  }
  res.json({ message: 'Opening times saved', times: req.body });
});

// Time slots
app.get('/api/timeslots', async (req, res) => {
  // Only return slots at least 30 minutes in the future
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let slots = await TimeSlot.find();
  // Filter out slots that start in less than 30 minutes
  const availableSlots = slots.filter(slot => {
    // slot.time is expected to be like '17:30-18:00' or '18:00-18:30'
    const match = /^([0-9]{1,2}):([0-9]{2})/.exec(slot.time);
    if (!match) return false;
    const slotHour = parseInt(match[1], 10);
    const slotMin = parseInt(match[2], 10);
    const slotStartMinutes = slotHour * 60 + slotMin;
    return slotStartMinutes - nowMinutes >= 30;
  });
  res.json(availableSlots);
});
app.post('/api/timeslots', async (req, res) => {
  const slot = new TimeSlot({
    time: req.body.time,
    doughLimit: typeof req.body.doughLimit === 'number' ? req.body.doughLimit : 0,
    deliveryAmount: typeof req.body.deliveryAmount === 'number' ? req.body.deliveryAmount : 0
  });
  await slot.save();
  res.status(201).json({ message: 'Time slot saved', slot });
});
app.delete('/api/timeslots/:id', async (req, res) => {
  await TimeSlot.findByIdAndDelete(req.params.id);
  res.json({ message: 'Time slot deleted' });
});
// Batch create time slots
app.post('/api/timeslots/batch', async (req, res) => {
  const { slots } = req.body;
  if (!Array.isArray(slots) || slots.length === 0) return res.status(400).json({ error: 'No slots provided' });
  await TimeSlot.deleteMany({});
  // Each slot can be { time, doughLimit, deliveryAmount }
  await TimeSlot.insertMany(slots.map(slot => ({
    time: typeof slot === 'string' ? slot : slot.time,
    doughLimit: (typeof slot === 'object' && typeof slot.doughLimit === 'number') ? slot.doughLimit : 0,
    deliveryAmount: (typeof slot === 'object' && typeof slot.deliveryAmount === 'number') ? slot.deliveryAmount : 0
  })));
  res.json({ message: 'Time slots generated', count: slots.length });
});
// Update delivery amount for a slot
app.patch('/api/timeslots/:id', async (req, res) => {
  const { id } = req.params;
  const update = {};
  if ('deliveryAmount' in req.body) update.deliveryAmount = req.body.deliveryAmount;
  if ('doughLimit' in req.body) update.doughLimit = req.body.doughLimit;
  const slot = await TimeSlot.findByIdAndUpdate(id, update, { new: true });
  if (!slot) return res.status(404).json({ error: 'Time slot not found' });
  res.json({ message: 'Time slot updated', slot });
});

// Dough tracked items
app.get('/api/dough-items', (req, res) => {
  res.json({ doughTrackedItems, gfDoughTrackedItems });
});
app.post('/api/dough-items', (req, res) => {
  const { doughTrackedItems: dough, gfDoughTrackedItems: gfDough } = req.body;
  if (Array.isArray(dough)) doughTrackedItems = dough;
  if (Array.isArray(gfDough)) gfDoughTrackedItems = gfDough;
  res.json({ message: 'Dough items saved', doughTrackedItems, gfDoughTrackedItems });
});

// Pizza Topping stock
app.get('/api/pizza-topping-stock', async (req, res) => {
  const toppings = await PizzaToppingStock.find();
  res.json(toppings);
});
app.post('/api/pizza-topping-stock', async (req, res) => {
  const { toppingStatus } = req.body;
  if (!Array.isArray(toppingStatus)) return res.status(400).json({ error: 'Invalid toppingStatus' });
  await PizzaToppingStock.deleteMany({});
  await PizzaToppingStock.insertMany(
    toppingStatus.map(t => ({
      topping: t.topping,
      outOfStock: !!t.outOfStock,
      type: t.type || '',
      price: (t.type === 'other' && (typeof t.price !== 'number' || t.price === 0)) ? 0.5 : t.price
    }))
  );
  res.json({ message: 'Pizza topping stock updated' });
});

// Salad Topping stock
app.get('/api/salad-topping-stock', async (req, res) => {
  const toppings = await SaladToppingStock.find();
  res.json(toppings);
});
app.post('/api/salad-topping-stock', async (req, res) => {
  const { toppingStatus } = req.body;
  if (!Array.isArray(toppingStatus)) return res.status(400).json({ error: 'Invalid toppingStatus' });
  await SaladToppingStock.deleteMany({});
  await SaladToppingStock.insertMany(
    toppingStatus.map(t => ({
      topping: t.topping,
      outOfStock: !!t.outOfStock,
      type: t.type || '',
      price: (t.type === 'other' && (typeof t.price !== 'number' || t.price === 0)) ? 0.5 : t.price
    }))
  );
  res.json({ message: 'Salad topping stock updated' });
});

// Menu items
app.get('/api/menu', async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});
app.post('/api/menu', async (req, res) => {
  // Always enforce a section/category
  let body = { ...req.body };
  if (!body.section && !body.category) {
    body.section = 'Uncategorized';
    body.category = 'Uncategorized';
  } else if (body.section && !body.category) {
    body.category = body.section;
  } else if (body.category && !body.section) {
    body.section = body.category;
  }
  const item = new MenuItem(body);
  await item.save();
  res.status(201).json({ message: 'Menu item saved', item });
});

// PATCH: Update order status or details
app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const update = {};
  // Allow updating status, items, address, timeSlot, paymentType, customerNotes, allergens
  if ('status' in req.body) update.status = req.body.status;
  if ('items' in req.body) update.items = req.body.items;
  if ('address' in req.body) update.address = req.body.address;
  if ('timeSlot' in req.body) update.timeSlot = req.body.timeSlot;
  if ('slotId' in req.body) update.slotId = req.body.slotId;
  if ('paymentType' in req.body) update.paymentType = req.body.paymentType;
  if ('customerNotes' in req.body) update.customerNotes = req.body.customerNotes;
  if ('allergens' in req.body) update.allergens = req.body.allergens;
  if ('type' in req.body) update.type = req.body.type;
  if ('name' in req.body) update.name = req.body.name;
  // Add more fields as needed
  if (Object.keys(update).length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  const order = await Order.findByIdAndUpdate(id, update, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  // Send email if accepted and order has an email
  if (update.status === 'Accepted' && order.address && order.address.email) {
    try {
      // Build order summary and total price
      const itemsList = order.items.map(item => {
        const notes = item.notes ? ` (Notes: ${item.notes})` : '';
        return `- ${item.name} (${item.size}") x${item.quantity} \u00a3${item.price}${notes}`;
      }).join('\n');
      const total = order.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0).toFixed(2);
      const orderDetails = `Order details:\n${itemsList}\nTotal: \u00a3${total}`;
      await transporter.sendMail({
        from: 'thecrustngb@hotmail.com',
        to: order.address.email,
        subject: 'Your Pizza Order Has Been Accepted',
        text: `Hi ${order.name},\n\nYour order for ${order.timeSlot} has been accepted!\n\n${orderDetails}\n\nThank you for ordering from None Go Bye.`
      });
    } catch (e) {
      // Failed to send email
    }
  }

  res.json({ message: 'Order updated', order });
});

// Gluten free dough stock
app.get('/api/gf-dough-stock', async (req, res) => {
  let doc = await GFDoughStock.findOne();
  if (!doc) doc = await GFDoughStock.create({ stock: 0 });
  res.json({ stock: doc.stock, outOfStock: doc.stock <= 0 });
});
app.post('/api/gf-dough-stock', async (req, res) => {
  const { stock } = req.body;
  if (typeof stock !== 'number' || stock < 0) return res.status(400).json({ error: 'Invalid stock value' });
  let doc = await GFDoughStock.findOne();
  if (!doc) doc = await GFDoughStock.create({ stock });
  else doc.stock = stock;
  await doc.save();
  res.json({ stock: doc.stock, outOfStock: doc.stock <= 0 });
});

// Email setup
const nodemailer = require('nodemailer');
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: emailUser, // should be 'apikey' for SendGrid
    pass: emailPass
  }
});

// --- ADMIN SESSION CHECK ENDPOINT ---
app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Admin: update order status (accept/decline)
// Admin: delete all orders (for test cleanup)
app.delete('/api/orders', async (req, res) => {
  await Order.deleteMany({});
  res.json({ message: 'All orders deleted' });
});
app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  // Send email if accepted and order has an email
  if (status === 'Accepted' && order.address && order.address.email) {
    try {
      // Build order summary and total price
      const itemsList = order.items.map(item => {
        const notes = item.notes ? ` (Notes: ${item.notes})` : '';
        return `- ${item.name} (${item.size}") x${item.quantity} £${item.price}${notes}`;
      }).join('\n');
      const total = order.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0).toFixed(2);
      const orderDetails = `Order details:\n${itemsList}\nTotal: £${total}`;
      await transporter.sendMail({
        from: 'thecrustngb@hotmail.com',
        to: order.address.email,
        subject: 'Your Pizza Order Has Been Accepted',
        text: `Hi ${order.name},\n\nYour order for ${order.timeSlot} has been accepted!\n\n${orderDetails}\n\nThank you for ordering from None Go Bye.`
      });
    } catch (e) {
      // Failed to send email
    }
  }
  res.json({ message: 'Order status updated', order });
});

// --- REFUND ENDPOINT ---
app.post('/api/orders/:id/refund', async (req, res) => {
  const { id } = req.params;
  // Accept both refundAmount/refundReason (from UI) and amount/reason (legacy)
  const refundAmount = req.body.refundAmount || req.body.amount;
  const refundReason = req.body.refundReason || req.body.reason;
  if (!refundAmount || isNaN(refundAmount) || refundAmount <= 0) return res.status(400).json({ error: 'Invalid refund amount' });
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.refundAmount = refundAmount;
  order.refundDate = new Date();
  order.refundReason = refundReason || '';
  await order.save();
  res.json({ success: true, order });
});

// --- SPECIAL OFFERS API ---
const offersRouter = require('./offers');
app.use('/api/offers', offersRouter);

// --- VOUCHERS API ---
const vouchersRouter = require('./vouchers');
app.use('/api/vouchers', vouchersRouter);


// Global Express error handler (must be after all routes)
app.use((err, req, res, next) => {
  // Global Express error handler
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Server start
app.listen(PORT, '0.0.0.0', err => {
  if (err) {
    // Server failed to start
    process.exit(1);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
// End of index.js



