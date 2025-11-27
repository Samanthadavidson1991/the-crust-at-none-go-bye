// ...existing code...

// Place this after app is initialized
// Admin authentication check endpoint
// (Moved below app initialization)
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


app.use(cors());
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
    app.use(cors({ origin: 'https://the-crust-at-none-go-bye-admin.onrender.com', credentials: true }));
    app.use(express.json());

    // --- ROUTES ---
    // Helper: Admin authentication middleware
    function requireAdminAuth(req, res, next) {
      if (req.session && req.session.isAdmin) return next();
      res.status(401).json({ error: 'Not authenticated' });
    }

    // Static file serving and HTML routes
    // Serve all static and HTML routes for both main and admin pages
    app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
    app.use('/styles.css', express.static(path.join(__dirname, 'public', 'styles.css')));
    app.use('/admin-order-toast.js', express.static(path.join(__dirname, 'public', 'admin-order-toast.js')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/', (req, res) => {
      const host = req.headers.host || req.hostname;
      console.log("[GET /] Host header:", host);
      // Use full match for admin.thecrustatngb.co.uk
      if (host && host.toLowerCase().includes('admin.thecrustatngb.co.uk')) {
        res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
      } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });
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
    app.get('/stock-management.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'stock-management.html'));
    });
    app.get('/takings.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'takings.html'));
    });
    app.get('/takings-totals.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'takings-totals.html'));
    });
    app.get('/timeslots.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'timeslots.html'));
    });
    app.get('/pos.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'pos.html'));
    });
    app.get('/running-orders.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'running-orders.html'));
    });
    app.get('/admin-menu.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
    });
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
    app.get('/api/menu', (req, res) => {
      res.json({
        items: [
          { name: 'Margherita', price: 8.5 },
          { name: 'Pepperoni', price: 9.5 },
          { name: 'Veggie', price: 9.0 }
        ]
      });
    });

    app.get('/api/orders', (req, res) => {
      res.json([
        { _id: 'order1', name: 'Sam', items: [{ name: 'Margherita', quantity: 1 }], timeSlot: '18:00', status: 'Pending' },
        { _id: 'order2', name: 'Alex', items: [{ name: 'Pepperoni', quantity: 2 }], timeSlot: '19:00', status: 'Accepted' }
      ]);
    });

    app.get('/api/pizza-topping-stock', (req, res) => {
      res.json({
        toppings: [
          { name: 'Pepperoni', stock: 20 },
          { name: 'Mushrooms', stock: 15 },
          { name: 'Olives', stock: 10 }
        ]
      });
    });

    app.get('/api/salad-topping-stock', (req, res) => {
      res.json({
        toppings: [
          { name: 'Lettuce', stock: 30 },
          { name: 'Tomato', stock: 25 },
          { name: 'Cucumber', stock: 20 }
        ]
      });
    });

    // All route definitions are now inside mongoose.connect .then()

    // Start server after all middleware and routes are set up
    app.listen(PORT, '0.0.0.0', err => {
      if (err) {
        process.exit(1);
      } else {
        console.log(`Server running on port ${PORT}`);
      }
    });
  }) // <-- Add this closing brace to end .then()
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
// (Removed duplicate admin login/logout routes)



// --- DELIVERY DISTANCE CONFIG SCHEMA ---

