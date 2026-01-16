// (Moved opening-times, delivery-distance, and timeslots models & endpoints below app/mongoose init)
// Ensure all schemas are registered before any model usage
require('./topping.model');
require('./section.model');
// Admin authentication check endpoint
const path = require('path');
require('dotenv').config();

// --- REFUND ENDPOINT ---
// (Moved below app initialization)
// ...existing code...



const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
if (!process.env.PORT) {
  throw new Error('PORT environment variable is required. This app must be run with process.env.PORT set (e.g., by Render).');
}

const PORT = process.env.PORT;
console.log('ADMIN_DASHBOARD:', process.env.ADMIN_DASHBOARD);


// Removed default CORS to avoid conflicts. Only use configured CORS after session setup.
// Parse JSON request bodies
// ...existing code...
const dbUser = process.env.MONGO_ATLAS_USERNAME;
const dbPassword = process.env.MONGO_ATLAS_PASSWORD;
const atlasUri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.qec8gul.mongodb.net/pizzaShop?retryWrites=true&w=majority&appName=Cluster0`;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretkey';
console.log('Connecting to MongoDB...');

mongoose.connect(atlasUri)
  .then(() => {
    console.log('MongoDB connected!');
    // MongoDB connected, now initialize session store

    // Session middleware must come first
    app.use(session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: atlasUri,
        collectionName: 'sessions',
        ttl: 60 * 60 * 24, // 1 day
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        // domain property removed for Render compatibility
      }
    }));
    // CORS with credentials for cross-origin cookies
    const allowedOrigins = [
      'https://the-crust-at-none-go-bye-admin.onrender.com',
      'https://admin.thecrustatngb.co.uk',
      'https://thecrustatngb.co.uk'
    ];
    app.use(cors({
      origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));
    app.use(express.json());

    // --- Local Menu API for Admin Tools ---
    const MenuItem = require('./menu-item.model');
    app.get('/api/menu', async (req, res) => {
      try {
        const menu = await MenuItem.find({});
        res.json(menu);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch menu', details: err.message });
      }
    });
    // --- ROUTES ---
    // Serve admin-menu.html at / for any admin domain BEFORE static middleware
    app.get('/', (req, res, next) => {
      const host = (req.headers.host || req.hostname || '').toLowerCase();
      console.log("[GET /] Host header:", host);
      // Match any host containing both 'admin' and ('thecrust' or 'none-go-bye')
      if (
        host.includes('admin') &&
        (host.includes('thecrust') || host.includes('none-go-bye'))
      ) {
        // Protect admin homepage with login
        requireAdminAuth(req, res, () => {
          res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
        });
      } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });
  const selectedMenuSetsRouter = require('./selected-menu-sets');
  app.use('/api/selected-menu-sets', selectedMenuSetsRouter);
    // Helper: Admin authentication middleware
    function requireAdminAuth(req, res, next) {
      if (req.session && req.session.isAdmin) return next();
        // Redirect to login.html if not authenticated
        res.redirect('/login.html');
    }
    // Static file serving and HTML routes
    app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
    app.use('/styles.css', express.static(path.join(__dirname, 'public', 'styles.css')));
    app.use('/admin-order-toast.js', express.static(path.join(__dirname, 'public', 'admin-order-toast.js')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/index.html', (req, res) => {
      const host = req.hostname || req.headers.host;
      console.log("[GET /index.html] Hostname:", req.hostname, "Host header:", req.headers.host);
      if (host && host.toLowerCase().startsWith('admin.')) {
        // Block index.html for admin subdomain
        res.redirect('/admin-menu.html');
      } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });
    app.get('/menu.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'menu.html'));
    });
    app.get('/checkout.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
    });
    app.get('/allergens.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'allergens.html'));
    });
    app.get('/offers.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'offers.html'));
    });
    app.get('/orders.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'orders.html'));
    });
    app.get('/sales-summary.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'sales-summary.html'));
    });
      app.get('/sales-summary.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'sales-summary.html'));
      });
    app.get('/stock-management.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'stock-management.html'));
    });
      app.get('/stock-management.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'stock-management.html'));
      });
    app.get('/takings.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'takings.html'));
    });
      app.get('/takings.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'takings.html'));
      });
    app.get('/takings-totals.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'takings-totals.html'));
    });
      app.get('/takings-totals.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'takings-totals.html'));
      });
    app.get('/timeslots.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'timeslots.html'));
    });
      app.get('/timeslots.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'timeslots.html'));
      });
    app.get('/pos.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'pos.html'));
    });
      app.get('/pos.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'pos.html'));
      });
    app.get('/running-orders.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'running-orders.html'));
    });
      app.get('/running-orders.html', requireAdminAuth, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'running-orders.html'));
      });
    // Only one route for /admin-menu.html, protected by login
    app.get('/admin-menu.html', requireAdminAuth, (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
    });
    // Always allow access to /login.html
    app.get('/login.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'login.html'));
    });

    // API routes
    app.get('/api/admin/check', (req, res) => {
      res.json({ authenticated: true });
    });
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
    app.post('/api/admin/logout', (req, res) => {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    });

    // Mock API endpoints for admin dashboard
    // Use MenuItem model for menu endpoints
    require('./topping.model');
    const Section = require('./section.model');
    // Master Toppings and Section Assignments endpoints
    app.use('/api/master-toppings', require('./master-toppings'));
    app.use('/api/section-topping-assignments', require('./section-topping-assignments'));
    // Special Offers API endpoint
    app.use('/api/offers', require('./offers'));

    // Section endpoints
    app.get('/api/sections', async (req, res) => {
      try {
        const sections = await Section.find({}).sort({ order: 1 }).populate('toppings');
        res.json({ sections });
      } catch (err) {
        console.error('[GET /api/sections] Error:', err);
        res.status(500).json({ error: 'Failed to fetch sections', details: err.message });
      }
    });

    app.post('/api/sections', async (req, res) => {
      try {
        const { name, toppings } = req.body;
        const existing = await Section.findOne({ name });
        if (existing) {
          return res.status(409).json({ error: 'Section already exists' });
        }
        const section = new Section({ name, toppings });
        await section.save();
        await section.populate('toppings');
        res.json({ success: true, section });
      } catch (err) {
        console.error('[POST /api/sections] Error:', err);
        res.status(400).json({ error: 'Failed to add section', details: err.message });
      }
    });
    // Update section toppings
    app.put('/api/sections/:id', async (req, res) => {
      try {
        const { toppings } = req.body;
        const section = await Section.findByIdAndUpdate(
          req.params.id,
          { $set: { toppings } },
          { new: true }
        ).populate('toppings');
        res.json({ success: true, section });
      } catch (err) {
        res.status(400).json({ error: 'Failed to update section toppings', details: err.message });
      }
    });

    app.delete('/api/sections/:id', async (req, res) => {
      try {
        const { id } = req.params;
        await Section.findByIdAndDelete(id);
        res.json({ success: true });
      } catch (err) {
        console.error('[DELETE /api/sections] Error:', err);
        res.status(400).json({ error: 'Failed to delete section', details: err.message });
      }
    });

    // Serve menu for both admin and main site
    app.get('/api/menu', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        try {
          const items = await MenuItem.find({});
          // Get all master toppings
          const allToppings = await require('./topping.model').find({});
          // Map topping ObjectId to name
          const toppingMap = {};
          allToppings.forEach(t => {
            toppingMap[t._id.toString()] = t.name;
            toppingMap[t.name] = t.name; // allow name lookup too
          });
          // Replace toppings array with names if needed
          const itemsWithToppingNames = items.map(item => {
            if (Array.isArray(item.toppings)) {
              return {
                ...item.toObject(),
                toppings: item.toppings.map(top => toppingMap[top] || top)
              };
            }
            return item;
          });
          console.log('[GET /api/menu] Returned items:', itemsWithToppingNames);
          res.json({ items: itemsWithToppingNames });
        } catch (err) {
          console.error('[GET /api/menu] Error:', err);
          res.status(500).json({ error: 'Failed to fetch menu items', details: err.message });
        }
      });

    app.post('/api/menu', async (req, res) => {
      try {
        console.log('[POST /api/menu] Received body:', req.body);
        // Only create new item if not exists
        const existing = await MenuItem.findOne({ name: req.body.name, section: req.body.section });
        if (existing) {
          return res.status(409).json({ error: 'Menu item already exists. Use PUT to update.' });
        }
        const item = new MenuItem(req.body);
        await item.save();
        console.log('[POST /api/menu] Saved item:', item);
        res.json({ success: true, item });
      } catch (err) {
        console.error('[POST /api/menu] Error:', err);
        res.status(400).json({ error: 'Failed to add menu item', details: err.message });
      }
    });

    // Add PUT endpoint for updating menu items (move outside POST handler)
    app.put('/api/menu', async (req, res) => {
      try {
        console.log('[PUT /api/menu] Received body:', req.body);
        if (Array.isArray(req.body)) {
          // SAFEGUARD: Prevent deleting all items if menu is empty
          if (req.body.length === 0) {
            return res.status(400).json({ error: 'Menu array is empty. Refusing to delete all items. Please add at least one section and item before saving.' });
          }
          // Bulk update
          // 1. Build a set of all submitted items (name + section)
          const submittedKeys = new Set(req.body.map(item => `${item.name}|||${item.section}`));
          // 2. Fetch all current items from MongoDB
          const allItems = await MenuItem.find({});
          console.log('[PUT /api/menu] Current DB items:', allItems);
          // 3. Delete any item not present in submittedKeys
          for (const dbItem of allItems) {
            const key = `${dbItem.name}|||${dbItem.section}`;
            if (!submittedKeys.has(key)) {
              console.log(`[PUT /api/menu] Deleting item: ${key}`);
              await MenuItem.deleteOne({ _id: dbItem._id });
            } else {
              console.log(`[PUT /api/menu] Keeping item: ${key}`);
            }
          }
          // 4. Upsert submitted items
          const results = [];
          for (const item of req.body) {
            const updated = await MenuItem.findOneAndUpdate(
              { name: item.name, section: item.section },
              item,
              { new: true, upsert: true }
            );
            results.push(updated);
          }
          console.log('[PUT /api/menu] Upserted items:', results);
          res.json({ success: true, items: results });
        } else {
          // Single update
          const updated = await MenuItem.findOneAndUpdate(
            { name: req.body.name, section: req.body.section },
            req.body,
            { new: true, upsert: true }
          );
          console.log('[PUT /api/menu] Upserted single item:', updated);
          res.json({ success: true, item: updated });
        }
      } catch (err) {
        console.error('[PUT /api/menu] Error:', err);
        res.status(400).json({ error: 'Failed to update menu item', details: err.message });
      }
    });

    // Delete menu item by ID
    app.delete('/api/menu/:id', async (req, res) => {
      try {
        const id = req.params.id;
        await MenuItem.findByIdAndDelete(id);
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: 'Failed to delete menu item', details: err.message });
      }
    });

    app.get('/api/orders', (req, res) => {
      res.json([
        { _id: 'order1', name: 'Sam', items: [{ name: 'Margherita', quantity: 1 }], timeSlot: '18:00', status: 'Pending' },
        { _id: 'order2', name: 'Alex', items: [{ name: 'Pepperoni', quantity: 2 }], timeSlot: '19:00', status: 'Accepted' }
      ]);
    });

    // --- ADD POST /api/orders ENDPOINT ---
    app.post('/api/orders', async (req, res) => {
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
        doughLimit: { type: Number, default: 0 },
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

      // --- Timeslots API ---
      app.get('/api/timeslots', async (req, res) => {
        try {
          const slots = await Timeslot.find({});
          res.json(slots);
        } catch (err) {
          res.status(500).json({ error: 'Failed to fetch timeslots', details: err.message });
        }
      });
      app.post('/api/timeslots', async (req, res) => {
        try {
          const slot = new Timeslot(req.body);
          await slot.save();
          res.json({ success: true, slot });
        } catch (err) {
          res.status(500).json({ error: 'Failed to add timeslot', details: err.message });
        }
      });
      app.patch('/api/timeslots/:id', async (req, res) => {
        try {
          const slot = await Timeslot.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
          // Insert new slots
          const created = await Timeslot.insertMany(slots);
          res.json({ success: true, slots: created });
        } catch (err) {
          res.status(500).json({ error: 'Failed to batch update timeslots', details: err.message });
        }
      });
      try {
        // In production, save order to database. For now, just echo back.
        const order = req.body;
        // TODO: Validate and save order to DB
        res.json({ success: true, order });
      } catch (err) {
        console.error('[POST /api/orders] Error:', err);
        res.status(500).json({ error: 'Failed to submit order', details: err.message });
      }
    });

    app.get('/api/pizza-topping-stock', (req, res) => {
      res.set('Cache-Control', 'no-store');
      res.json({
        toppings: [
          { name: 'Pepperoni', stock: 20 },
          { name: 'Mushrooms', stock: 15 },
          { name: 'Onions', stock: 10 },
          { name: 'Cheese', stock: 30 }
        ]
      });
    });

      // --- STRIPE PAYMENT INTENT ENDPOINT ---
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      app.post('/api/create-payment-intent', async (req, res) => {
        try {
          const { amount, currency = 'gbp' } = req.body;
          if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: 'Amount is required and must be a number.' });
          }
          // Stripe expects amount in pence
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            automatic_payment_methods: { enabled: true }
          });
          res.json({ clientSecret: paymentIntent.client_secret });
        } catch (err) {
          console.error('[POST /api/create-payment-intent] Error:', err);
          res.status(500).json({ error: 'Failed to create payment intent', details: err.message });
        }
      });
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });

const DoughStock = require('./dough-stock.model');

// --- Dough Stock API ---
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