import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Express is working!'));
app.listen(5050, () => console.log('Test server running on http://localhost:5050'));