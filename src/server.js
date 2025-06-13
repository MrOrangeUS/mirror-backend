require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const didService = require('./didService');
const chatService = require('./chatService');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store active streams with timestamps for cleanup
const activeStreams = new Map();

const TURN_URLS = process.env.TURN_URLS ? process.env.TURN_URLS.split(',') : [];
const TURN_USERNAME = process.env.TURN_USERNAME;
const TURN_CREDENTIAL = process.env.TURN_CREDENTIAL;

const getIceServers = () => [
  { urls: 'stun:stun.l.google.com:19302' },
  ...TURN_URLS.filter(Boolean)
    .map(url => url.replace(/\?.*$/, '')) // Remove ?transport=... if present
    .filter(url => url.startsWith('turn:'))
    .map(url => ({
      urls: url,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL
    }))
];

// Cleanup old streams periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [streamId, data] of activeStreams.entries()) {
    if (now - data.timestamp > 30 * 60 * 1000) { // 30 minutes
      didService.deleteStream(streamId, data.sessionId)
        .catch(err => console.error('Error cleaning up stream:', err));
      activeStreams.delete(streamId);
    }
  }
}, 5 * 60 * 1000);

// Helper function to handle D-ID API errors
function handleDIDError(error, res) {
  console.error('D-ID API error:', error.response?.data || error.message);
  
  if (error.response?.status === 429) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please try again in a few seconds.',
      retryAfter: error.response.headers['retry-after'] || 5
    });
  }
  
  if (error.response?.status === 403) {
    return res.status(403).json({ 
      error: error.response.data.description || 'Session limit exceeded'
    });
  }
  
  return res.status(500).json({ 
    error: 'Internal server error',
    details: error.response?.data || error.message
  });
}

// Routes
app.post('/streams', async (req, res) => {
  try {
    const { streamId, sessionId, offer } = await didService.createStream();
    activeStreams.set(streamId, { 
      sessionId,
      timestamp: Date.now()
    });
    res.json({ streamId, sessionId, offer, iceServers: getIceServers() });
  } catch (error) {
    handleDIDError(error, res);
  }
});

app.post('/streams/:streamId/sdp', async (req, res) => {
  const { streamId } = req.params;
  const answer = req.body.answer && req.body.answer.type ? req.body.answer : req.body;
  const stream = activeStreams.get(streamId);
  
  if (!stream) {
    return res.status(404).json({ error: 'Stream not found' });
  }

  try {
    await didService.handleSDP(streamId, stream.sessionId, answer);
    res.json({ success: true });
  } catch (error) {
    handleDIDError(error, res);
  }
});

app.post('/streams/:streamId/ice', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { candidate, sdpMid, sdpMLineIndex } = req.body;
    const stream = activeStreams.get(streamId);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    await didService.handleICE(streamId, stream.sessionId, { candidate, sdpMid, sdpMLineIndex });
    res.json({ success: true });
  } catch (error) {
    handleDIDError(error, res);
  }
});

app.post('/streams/:streamId/say', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { text } = req.body;
    const stream = activeStreams.get(streamId);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    await didService.say(streamId, stream.sessionId, text);
    res.json({ success: true });
  } catch (error) {
    handleDIDError(error, res);
  }
});

app.delete('/streams/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const stream = activeStreams.get(streamId);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    await didService.deleteStream(streamId, stream.sessionId);
    activeStreams.delete(streamId);
    res.json({ success: true });
  } catch (error) {
    handleDIDError(error, res);
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatService.getResponse(message);
    res.json({ response });
  } catch (error) {
    logError(error);
    console.error('Error getting chat response:', error);
    res.status(500).json({ error: 'Failed to get chat response' });
  }
});

// Add QR code endpoint
app.get('/qr', async (req, res) => {
  try {
    const url = 'https://www.tiktok.com/@yourprofile'; // Replace with your TikTok or any link
    const qrSvg = await QRCode.toString(url, { type: 'svg' });
    res.json({ qrCode: qrSvg });
  } catch (error) {
    logError(error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('/chat-starter', (req, res) => {
  res.json({ starter: chatService.getStarterPrompt() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 