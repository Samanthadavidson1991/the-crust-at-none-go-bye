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

// Enable CORS for admin and public domains
app.use(cors({
  origin: [
    'https://admin.thecrustatngb.co.uk',
    'https://thecrustatngb.co.uk',
    'https://the-crust-at-none-go-bye-admin.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Enable JSON body parsing for API requests
app.use(express.json());

// Enable session support for admin authentication
// Set default MongoDB URI if not present
if (!process.env.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI environment variable is not set. Please set it in your .env file.');
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24, // 1 day
  }),
  cookie: {
    secure: false, // Force false for local/dev to allow cookies over HTTP
    sameSite: 'lax',
    httpOnly: true
  }
}));

// Protect admin-only HTML pages (must be before express.static)
app.get('/admin-sales.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-sales.html'));
});
app.get('/orders.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});
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
  // For public site, serve coming-soon.html
  return res.sendFile(path.join(__dirname, 'public', 'coming-soon.html'));
});

// Serve all static files from public directory (must be after admin and root routes)
app.use(express.static(path.join(__dirname, 'public')));

// PORT is already declared above, do not redeclare



// Admin authentication middleware
// Admin session check endpoint for frontend
// GET /api/orders - Return all orders for admin
// GET /api/orders/dates - Return unique dates with orders (YYYY-MM-DD)
app.get('/api/orders/dates', requireAdminAuth, async (req, res) => {
  try {
    const Order = require('./order.model');
    const orders = await Order.find({}, { createdAt: 1 });
    const dateSet = new Set();
    const debugDates = [];
    for (const order of orders) {
      if (order.createdAt) {
        const date = new Date(order.createdAt);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        dateSet.add(dateStr);
        debugDates.push({ createdAt: order.createdAt, dateStr });
      }
    }
    console.log('[ORDER DATES DEBUG]', debugDates);
    res.json(Array.from(dateSet));
  } catch (err) {
    console.error('Error fetching order dates:', err);
    res.status(500).json({ error: 'Failed to fetch order dates' });
  }
});
// POST /api/orders/:id/accept - Accept an order
app.post('/api/orders/:id/accept', requireAdminAuth, async (req, res) => {
  try {
    const Order = require('./order.model');
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'accepted' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    console.error('Error accepting order:', err);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// POST /api/orders/:id/decline - Decline an order
app.post('/api/orders/:id/decline', requireAdminAuth, async (req, res) => {
  try {
    const Order = require('./order.model');
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'declined' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true, order });
  } catch (err) {
    console.error('Error declining order:', err);
    res.status(500).json({ error: 'Failed to decline order' });
  }
});
app.get('/api/orders', requireAdminAuth, async (req, res) => {
      console.log('[ORDERS API DEBUG] req.url:', req.url);
    console.log('[ORDERS API DEBUG] req.query:', req.query);
  try {
    const Order = require('./order.model');
    let query = {};
    if (req.query.date) {
      // Filter orders by date (YYYY-MM-DD), ignoring time (works across timezones)
      const dateStr = req.query.date;
      // Use MongoDB aggregation to match only the date part
      const orders = await Order.aggregate([
        {
          $addFields: {
            createdAtDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" }
            }
          }
        },
        { $match: { createdAtDate: dateStr } },
        { $sort: { createdAt: -1 } },
        { $limit: 100 }
      ]);
      console.log('[ORDERS API DEBUG] Aggregation for date', dateStr, '| Found:', orders.length, '| createdAt values:', orders.map(o => o.createdAt));
      return res.json(orders);
    } else {
      const orders = await Order.find({}).sort({ createdAt: -1 }).limit(100);
      console.log('[ORDERS API DEBUG] No date filter | Found:', orders.length);
      return res.json(orders);
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});
app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ ok: true, admin: true });
  }
  return res.status(401).json({ ok: false, admin: false });
});
function requireAdminAuth(req, res, next) {
  // Enhanced debug logging for admin access troubleshooting
  console.log('requireAdminAuth:', {
    url: req.originalUrl,
    method: req.method,
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.headers.cookie,
    headers: req.headers,
    remoteAddress: req.connection && req.connection.remoteAddress
  });
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
// --- POST order creation endpoint ---
app.post('/api/orders', async (req, res) => {
// --- Update price for a pizza/menu item by name ---
app.post('/api/menu-item/update-price', async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || typeof price !== 'number') {
      return res.status(400).json({ error: 'Name and valid price required' });
    }
    const MenuItem = require('./menu-item.model');
    const item = await MenuItem.findOne({ name });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    item.price = price;
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item price', details: err.message });
  }
});
  try {
    const Order = require('./order.model');
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();
    res.status(201).json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});
// (Placed after all app and middleware setup to avoid ReferenceError)
app.patch('/api/orders/:orderId', async (req, res) => {
  try {
    const Order = require('./order.model');
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
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



// Register API routes for admin menu and customer menu functionality
app.use('/api/master-toppings', require('./master-toppings'));
app.use('/api/sections', require('./section-topping-assignments'));
app.use('/api/offers', require('./offers'));
app.use('/api/section-topping-assignments', require('./section-topping-assignments'));
// Dummy pizza-topping-stock endpoint for now (returns empty array)
app.get('/api/pizza-topping-stock', (req, res) => res.json([]));

// Basic /api/menu endpoint to return all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.json({ items });
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