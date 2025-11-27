import express from 'express';
const app = express();
const PORT = 5050;
app.get('/', (req, res) => {
  res.send('Express is working!');
});
app.listen(PORT, '0.0.0.0', () => {
  // Test Express server running on http://localhost:${PORT}
});
