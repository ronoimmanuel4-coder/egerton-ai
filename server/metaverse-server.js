const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Peer server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/metaverse',
  allow_discovery: true
});

app.use('/peerjs', peerServer);

// Simple API for room management
const rooms = new Map();

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms.keys()));
});

app.post('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  res.status(201).json({ roomId });
});

// Start server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Metaverse server running on port ${PORT}`);
});
