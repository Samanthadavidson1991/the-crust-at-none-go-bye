const http = require('http');
const PORT = process.env.PORT || 8081;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server running!\n');
});

server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
