const path = require('path');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const express = require('express');
const mongoose = require('mongoose');

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
require('./topping.model');
require('./section.model');

const MenuItem = require('./menu-item.model');

const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();

// Enable CORS for admin frontend and backend domains
app.use(cors({
  origin: [
    'https://admin.thecrustatngb.co.uk',
    'https://the-crust-at-none-go-bye-admin.onrender.com'
  ],
  credentials: true
}));


// Enable JSON body parsing for API requests
app.use(express.json());

// Enable session support for admin authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24, // 1 day
  }),
  cookie: { secure: false } // Set to true if using HTTPS only
}));

// Protect admin-only HTML pages (must be before express.static)
app.get('/admin-menu.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
});
app.get('/sales-summary.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sales-summary.html'));
});
app.get('/stock-management.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stock-management.html'));
});
app.get('/takings.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'takings.html'));
});
app.get('/takings-totals.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'takings-totals.html'));
});
app.get('/timeslots.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timeslots.html'));
});
app.get('/pos.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pos.html'));
});
app.get('/running-orders.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'running-orders.html'));
});



// Root route: show index.html for public, redirect to login for admin subdomain
app.get('/', (req, res) => {
  // Check if request is for admin subdomain (Render sets X-Forwarded-Host)
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (host.startsWith('admin.') || host.includes('admin-')) {
    // If already logged in as admin, go to admin menu editor
    if (req.session && req.session.isAdmin) {
      return res.redirect('/admin-menu.html');
    }
    // Otherwise, go to login page
    return res.redirect('/login.html');
  }
  // For public site, serve index.html
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve all static files from public directory (must be after admin and root routes)
app.use(express.static(path.join(__dirname, 'public')));

// PORT is already declared above, do not redeclare



// Admin authentication middleware
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  // Serve a custom 401 page if it exists, otherwise send a simple message
  const unauthorizedPath = path.join(__dirname, 'public', '401.html');
  const fs = require('fs');
  if (fs.existsSync(unauthorizedPath)) {
    res.status(401).sendFile(unauthorizedPath);
  } else {
    res.status(401).send('<h1>401 Unauthorized</h1><p>You must be logged in as admin to access this page.</p>');
  }
}
// --- Opening Times Model ---
const OpeningTimesSchema = new mongoose.Schema({
  friday: { open: String, close: String },
  saturday: { open: String, close: String },
  sunday: { open: String, close: String }
}, { collection: 'opening_times' });
const OpeningTimes = mongoose.models.OpeningTimes || mongoose.model('OpeningTimes', OpeningTimesSchema);

// --- Delivery Distance Model ---
const DeliveryDistanceSchema = new mongoose.Schema({ miles: Number }, { collection: 'delivery_distance' });
const DeliveryDistance = mongoose.models.DeliveryDistance || mongoose.model('DeliveryDistance', DeliveryDistanceSchema);

// --- Timeslot Model ---
const TimeslotSchema = new mongoose.Schema({
  time: String,
  doughLimit: { type: Number, default: 0 }, // total dough (normal + gluten free)
  deliveryAmount: { type: Number, default: 0 }
}, { collection: 'timeslots' });
const Timeslot = mongoose.models.Timeslot || mongoose.model('Timeslot', TimeslotSchema);

// --- Opening Times API ---
app.get('/api/opening-times', async (req, res) => {
  try {
    let doc = await OpeningTimes.findOne();
    if (!doc) doc = await OpeningTimes.create({ friday: {}, saturday: {}, sunday: {} });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch opening times', details: err.message });
  }
});
app.post('/api/opening-times', async (req, res) => {
  try {
    let doc = await OpeningTimes.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, openingTimes: doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save opening times', details: err.message });
  }
});

// --- Delivery Distance API ---
app.get('/api/delivery-distance', async (req, res) => {
  try {
    let doc = await DeliveryDistance.findOne();
    if (!doc) doc = await DeliveryDistance.create({ miles: 5 });
    res.json({ miles: doc.miles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery distance', details: err.message });
  }
});
app.post('/api/delivery-distance', async (req, res) => {
  try {
    let doc = await DeliveryDistance.findOneAndUpdate({}, { miles: req.body.miles }, { new: true, upsert: true });
    res.json({ success: true, miles: doc.miles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save delivery distance', details: err.message });
  }
});

// --- Timeslot API ---
app.get('/api/timeslots', async (req, res) => {
  try {
    const timeslots = await Timeslot.find();
    res.json(timeslots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeslots', details: err.message });
  }
});
app.post('/api/timeslots', async (req, res) => {
  try {
    // Accept only doughLimit
    const slot = new Timeslot({
      ...req.body,
      doughLimit: typeof req.body.doughLimit === 'number' ? req.body.doughLimit : 0
    });
    await slot.save();
    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add timeslot', details: err.message });
  }
});
app.patch('/api/timeslots/:id', async (req, res) => {
  try {
    // Accept only doughLimit
    const update = {
      ...req.body,
      ...(req.body.doughLimit !== undefined ? { doughLimit: req.body.doughLimit } : {})
    };
    const slot = await Timeslot.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update timeslot', details: err.message });
  }
});
app.delete('/api/timeslots/:id', async (req, res) => {
  try {
    await Timeslot.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete timeslot', details: err.message });
  }
});
app.post('/api/timeslots/batch', async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots)) return res.status(400).json({ error: 'Slots must be an array' });
    // Remove all existing timeslots
    await Timeslot.deleteMany({});
    // Insert new slots, ensure only doughLimit is present
    const slotsUnified = slots.map(slot => ({
      ...slot,
      doughLimit: typeof slot.doughLimit === 'number' ? slot.doughLimit : 0
    }));
    const created = await Timeslot.insertMany(slotsUnified);
    res.json({ success: true, slots: created });
  } catch (err) {

    res.status(500).json({ error: 'Failed to batch update timeslots', details: err.message });
    }
});

// --- Dough Stock API ---
const DoughStock = require('./dough-stock.model');
app.get('/api/dough-stock', async (req, res) => {
  try {
    let doc = await DoughStock.findOne({ type: 'normal' });
    if (!doc) doc = await DoughStock.create({ type: 'normal', stock: 0, outOfStock: false });
    console.log('[GET /api/dough-stock] Returning:', doc);
    res.json({ stock: doc.stock, outOfStock: doc.outOfStock });
  } catch (err) {
    console.error('[GET /api/dough-stock] Error:', err);
    res.status(500).json({ error: 'Failed to fetch dough stock', details: err.message });
  }
});
app.post('/api/dough-stock', async (req, res) => {
  try {
    const { stock } = req.body;
    console.log('[POST /api/dough-stock] Received stock:', stock);
    let doc = await DoughStock.findOneAndUpdate(
      { type: 'normal' },
      { stock, outOfStock: stock <= 0 },
      { new: true, upsert: true }
    );
    console.log('[POST /api/dough-stock] Updated doc:', doc);
    res.json({ success: true, stock: doc.stock, outOfStock: doc.outOfStock });
  } catch (err) {
    console.error('[POST /api/dough-stock] Error:', err);
    res.status(500).json({ error: 'Failed to update dough stock', details: err.message });
  }
});
app.get('/api/gf-dough-stock', async (req, res) => {
  try {
    let doc = await DoughStock.findOne({ type: 'gf' });
    if (!doc) doc = await DoughStock.create({ type: 'gf', stock: 0, outOfStock: false });
    res.json({ stock: doc.stock, outOfStock: doc.outOfStock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GF dough stock', details: err.message });
  }
});
app.post('/api/gf-dough-stock', async (req, res) => {
  try {
    const { stock } = req.body;
    let doc = await DoughStock.findOneAndUpdate(
      { type: 'gf' },
      { stock, outOfStock: stock <= 0 },
      { new: true, upsert: true }
    );
    res.json({ success: true, stock: doc.stock, outOfStock: doc.outOfStock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update GF dough stock', details: err.message });
  }
});

// --- Hide/Show Menu Item ---
app.patch('/api/menu/:name/hide', async (req, res) => {
  try {
    const { hidden } = req.body;
    const item = await MenuItem.findOneAndUpdate(
      { name: req.params.name },
      { hidden: !!hidden },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true, hidden: item.hidden });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hidden status', details: err.message });
  }
});

// --- PATCH order status endpoint ---
// (Placed after all app and middleware setup to avoid ReferenceError)
app.patch('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    // Update order status in MongoDB
    // const Order = require('./order.model');
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, status: order.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
});

// --- Sales Counts API ---
app.use('/api/sales-counts', require('./sales-counts'));

// --- DEBUG: Admin Login Endpoint ---
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password });
  try {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      console.log('Login success:', username);
      return res.json({ success: true });
    }
    console.log('Login failed:', { username, password });
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


// Register API routes for admin menu functionality
app.use('/api/master-toppings', require('./master-toppings'));
app.use('/api/sections', require('./section-topping-assignments'));

// Basic /api/menu endpoint to return all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.json(items);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// End of API and server setup
module.exports = app;

// Start server if run directly (not required as a module)
if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
}