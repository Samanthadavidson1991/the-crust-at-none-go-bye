// Minimal Express session example for Render
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'https://the-crust-at-none-go-bye-admin.onrender.com', credentials: true }));
app.use(express.json());

app.use(session({
  secret: 'yourSecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'yourMongoAtlasUri',
    collectionName: 'sessions',
    ttl: 60 * 60 * 24
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'none',
    secure: true
    // domain: removed for Render compatibility
  }
}));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'changeme123') {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/protected', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ message: 'You are authenticated!' });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('Minimal session server running');
});
