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
        domain: '.thecrustatngb.co.uk' // Ensures cookie is sent to all subdomains
      }
    }));
    // CORS with credentials for cross-origin cookies
    app.use(cors({ origin: 'https://admin.thecrustatngb.co.uk', credentials: true }));
    app.use(express.json());

    // --- ROUTES ---
    // Helper: Admin authentication middleware
    function requireAdminAuth(req, res, next) {
      if (req.session && req.session.isAdmin) return next();
      res.status(401).json({ error: 'Not authenticated' });
    }

    // Static file serving and HTML routes
    if (process.env.ADMIN_DASHBOARD === 'true') {
      app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
      app.use('/styles.css', express.static(path.join(__dirname, 'public', 'styles.css')));
      app.use('/admin-order-toast.js', express.static(path.join(__dirname, 'public', 'admin-order-toast.js')));
      app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
      });
      app.get('/admin-menu.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'admin-menu.html'));
      });
      app.get('/login.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
      });
      // Add more explicit admin HTML routes as needed
    } else {
      app.use(express.static(path.join(__dirname, 'public')));
    }

    // API routes
    app.get('/api/admin/check', requireAdminAuth, (req, res) => {
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

    // All other API routes (move all app.get/app.post/app.patch/app.delete here)
    // ...existing API route definitions from your file...

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

