const path = require('path');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const express = require('express');
const mongoose = require('mongoose');

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
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

const PORT = process.env.PORT || 3000;



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
    let doc = await DeliveryDistance.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, deliveryDistance: doc });
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
    const timeslot = await Timeslot.create(req.body);
    res.json({ success: true, timeslot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create timeslot', details: err.message });
  }
});

// --- Server Start Log ---

// Protect admin-only HTML pages
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
    // PATCH endpoint to update section order
    app.patch('/api/sections/:id/order', async (req, res) => {
      try {
        const { order } = req.body;
        const section = await Section.findByIdAndUpdate(
          req.params.id,
          { $set: { order } },
          { new: true }
        );
        res.json({ success: true, section });
      } catch (err) {
        // Global error handler for diagnostics
        app.use((err, req, res, next) => {
          console.error('Global error handler:', err);
          res.status(500).json({ error: 'Internal server error', details: err.message });
        });
        res.status(400).json({ error: 'Failed to update section order', details: err.message });
      }
    });
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

  const Order = require('./order.model');
    app.get('/api/orders', async (req, res) => {
      try {
        let filter = {};
        if (req.query.from && req.query.to) {
          // Filter by date range (inclusive)
          const from = new Date(req.query.from);
          const to = new Date(req.query.to);
          to.setHours(23, 59, 59, 999); // include the whole 'to' day
          filter.createdAt = { $gte: from, $lte: to };
        } else if (req.query.date) {
          // Filter by date (YYYY-MM-DD)
          const start = new Date(req.query.date);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          filter.createdAt = { $gte: start, $lt: end };
        } else {
          // Default: only show today's orders
          const today = new Date();
          today.setHours(0,0,0,0);
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          filter.createdAt = { $gte: today, $lt: tomorrow };
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
      } catch (err) {
        console.error('Error in /api/orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
      }
    });

    // --- ADD POST /api/orders ENDPOINT ---
    app.post('/api/orders', async (req, res) => {
              // --- VOUCHER LOGIC ---
              if (req.body.voucherCode) {
                const Voucher = require('./voucher.model');
                const voucher = await Voucher.findOne({ code: req.body.voucherCode });
                if (!voucher) {
                  return res.status(400).json({ error: 'Voucher not found.' });
                }
                if (voucher.used) {
                  return res.status(400).json({ error: 'Voucher already used.' });
                }
                if (typeof voucher.price === 'number' && voucher.price > 0) {
                  // Deduct voucher amount from total
                  const origTotal = req.body.total;
                  req.body.total = Math.max(0, origTotal - voucher.price);
                  // If voucher covers full amount, mark as used
                  if (voucher.price >= origTotal) {
                    voucher.used = true;
                    voucher.usedAt = new Date();
                    voucher.usedBy = req.body.email || req.body.name || '';
                    await voucher.save();
                  } else {
                    // Otherwise, reduce voucher balance
                    voucher.price = voucher.price - origTotal;
                    await voucher.save();
                  }
                }
              }
      try {
        // --- VALIDATE ORDER TIME ---
        const { timeSlot, date } = req.body;
        // Parse date and timeSlot
        let orderDate = null;
        if (date && timeSlot) {
          // date: YYYY-MM-DD, timeSlot: '18:00-18:30' or '18:00'
          const [startTime] = timeSlot.split('-');
          orderDate = new Date(`${date}T${startTime}:00`);
        } else {
          return res.status(400).json({ error: 'Order must include date and timeSlot.' });
        }
        // Get opening times for the day
        const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const dayName = dayNames[orderDate.getDay()];
        const OpeningTimes = require('./index.js').OpeningTimes || (mongoose.models.OpeningTimes || mongoose.model('OpeningTimes', new mongoose.Schema({
          friday: { open: String, close: String },
          saturday: { open: String, close: String },
          sunday: { open: String, close: String }
        }, { collection: 'opening_times' })));
        const openingDoc = await OpeningTimes.findOne();
        const openInfo = openingDoc && openingDoc[dayName];
        if (!openInfo || !openInfo.open || !openInfo.close) {
          return res.status(400).json({ error: 'We are closed on this day.' });
        }
        // Check if timeSlot is within open hours
        const [openHour, openMin] = openInfo.open.split(':').map(Number);
        const [closeHour, closeMin] = openInfo.close.split(':').map(Number);
        const slotHour = Number(startTime.split(':')[0]);
        const slotMin = Number(startTime.split(':')[1]);
        const slotMins = slotHour * 60 + slotMin;
        const openMins = openHour * 60 + openMin;
        const closeMins = closeHour * 60 + closeMin;
        if (slotMins < openMins || slotMins >= closeMins) {
          return res.status(400).json({ error: 'Selected time is outside opening hours.' });
        }
        // --- BLOCK ORDERS >40 MIN BEFORE SLOT ---
        const now = new Date();
        const diffMins = (orderDate - now) / 60000;
        if (diffMins > 40) {
          return res.status(400).json({ error: 'Orders can only be placed up to 40 minutes before the selected slot.' });
        }
        // --- PRE-ORDER: Mark as Pending Approval if in future ---
        if (diffMins > 0) {
          req.body.status = 'Pending Approval';
        }

        // --- NEW LOGIC: Assign order to multiple slots if needed ---
        // Calculate dough required
        // normalCount and gfCount already calculated above
        // Find all slots for the given date, sorted by time
        const Timeslot = mongoose.models.Timeslot || mongoose.model('Timeslot');
        const allSlots = await Timeslot.find({ time: { $regex: /^\d{2}:\d{2}/ } }).sort({ time: 1 });
        // Get all orders for the same date
        const Order = mongoose.models.Order || mongoose.model('Order');
        const existingOrders = await Order.find({ date });
        // Build a map of slot usage
        const slotUsage = {};
        for (const slot of allSlots) {
          slotUsage[slot.time] = { normal: 0, gf: 0 };
        }
        for (const order of existingOrders) {
          const slots = [order.timeSlot].concat(order.extraSlots || []);
          let n = 0, g = 0;
          if (Array.isArray(order.items)) {
            for (const item of order.items) {
              if (item.glutenFree) g += item.quantity || 1;
              else n += item.quantity || 1;
            }
          }
          for (const st of slots) {
            if (slotUsage[st]) {
              slotUsage[st].normal += n;
              slotUsage[st].gf += g;
            }
          }
        }
        // Find index of requested slot
        const slotIdx = allSlots.findIndex(s => s.time === timeSlot);
        if (slotIdx === -1) {
          return res.status(400).json({ error: 'Requested time slot not found.' });
        }
        // Try to fit order into consecutive slots, skipping blocks with occupied slots
        let found = false;
        let slotsNeeded = [];
        for (let startIdx = slotIdx; startIdx <= allSlots.length - 1; startIdx++) {
          let normalLeft = normalCount;
          let gfLeft = gfCount;
          let block = [];
          let idx = startIdx;
          while ((normalLeft > 0 || gfLeft > 0) && idx < allSlots.length) {
            const slot = allSlots[idx];
            const usage = slotUsage[slot.time];
            let totalCanFit = Math.max(0, slot.doughLimit - (usage.normal + usage.gf));
            let totalNeeded = normalLeft + gfLeft;
            let used = Math.min(totalNeeded, totalCanFit);
            if (totalCanFit === 0) {
              // Blocked, break and try next block
              break;
            }
            block.push(slot.time);
            let usedFromNormal = Math.min(normalLeft, used);
            let usedFromGF = used - usedFromNormal;
            normalLeft -= usedFromNormal;
            gfLeft -= usedFromGF;
            idx++;
          }
          if (normalLeft <= 0 && gfLeft <= 0) {
            slotsNeeded = block;
            found = true;
            break;
          }
        }
        if (!found || slotsNeeded.length === 0) {
          return res.status(400).json({ error: 'Not enough consecutive, unoccupied slots to fulfill order.' });
        }
        // Assign order to all needed slots (set timeSlot to first slot, and add extraSlots field)
        req.body.timeSlot = slotsNeeded[0];
        req.body.extraSlots = slotsNeeded.slice(1);
        // --- EXISTING LOGIC: Price assignment, dough decrement, save order ---
        console.log('[ORDER DEBUG] Incoming paymentType:', req.body.paymentType);
        console.log('[ORDER DEBUG] Incoming order items:', JSON.stringify(req.body.items, null, 2));
        const allMenuItems = await MenuItem.find({});
        console.log('[ORDER DEBUG] All menu items:', allMenuItems.map(mi => ({ name: mi.name, sizes: mi.sizes, price: mi.price })));
        if (Array.isArray(req.body.items)) {
          for (const item of req.body.items) {
            console.log('[ORDER DEBUG] Processing item:', JSON.stringify(item));
            if (typeof item.price === 'undefined') {
              const dbItem = await MenuItem.findOne({ name: item.name });
              console.log(`[ORDER DEBUG] Looking up menu item for: '${item.name}'`, dbItem ? '(found)' : '(not found)', dbItem);
              if (dbItem) {
                if (item.size && Array.isArray(dbItem.sizes)) {
                  const sizeObj = dbItem.sizes.find(s => s.name && item.size && s.name.toLowerCase() === item.size.toLowerCase());
                  console.log(`[ORDER DEBUG] Size lookup for '${item.name}' (size: '${item.size}'):`, sizeObj ? sizeObj : '(not found)');
                  if (sizeObj && typeof sizeObj.price === 'number') {
                    item.price = sizeObj.price;
                    console.log(`[ORDER DEBUG] Assigned size price for '${item.name}' (size: '${item.size}'):`, item.price);
                  } else if (typeof dbItem.price === 'number') {
                    item.price = dbItem.price;
                    console.log(`[ORDER DEBUG] Assigned top-level price for '${item.name}':`, item.price);
                  } else {
                    console.warn(`[ORDER PRICE] No size price or top-level price for item: '${item.name}' (size: '${item.size}') in order. Setting price=0.`);
                    item.price = 0;
                  }
                } else if (typeof dbItem.price === 'number') {
                  item.price = dbItem.price;
                  console.log(`[ORDER DEBUG] Assigned top-level price for '${item.name}':`, item.price);
                } else {
                  console.warn(`[ORDER PRICE] No price for item: '${item.name}' in order. Setting price=0.`);
                  item.price = 0;
                }
              } else {
                console.warn(`[ORDER PRICE] No menu match for item: '${item.name}' in order. Setting price=0.`);
                item.price = 0;
              }
            } else {
              console.log(`[ORDER DEBUG] Price already set for '${item.name}':`, item.price);
            }
            console.log('[ORDER DEBUG] Final item after price assignment:', JSON.stringify(item));
          }
        }
        const order = new Order(req.body);
        await order.save();
        console.log('[ORDER DEBUG] Saved order paymentType:', order.paymentType);
        const DoughStock = require('./dough-stock.model');
        let normalCount = 0;
        let gfCount = 0;
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.glutenFree) {
              gfCount += item.quantity || 1;
            } else {
              normalCount += item.quantity || 1;
            }
          }
        }
        if (normalCount > 0) {
          await DoughStock.findOneAndUpdate(
            { type: 'normal' },
            { $inc: { stock: -normalCount } }
          );
        }
        if (gfCount > 0) {
          await DoughStock.findOneAndUpdate(
            { type: 'gf' },
            { $inc: { stock: -gfCount } }
          );
        }
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

      console.log(`Server running on port ${PORT}`);
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

// End of API and server setup
module.exports = app;