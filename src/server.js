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

// Store active streams
const activeStreams = new Map();

function logError(error) {
  const logMsg = `\n[${new Date().toISOString()}] ${error.stack || error}`;
  fs.appendFileSync('error.log', logMsg);
}

// Routes
app.post('/streams', async (req, res) => {
  try {
    const { streamId, sessionId } = await didService.createStream();
    activeStreams.set(streamId, { sessionId });
    res.json({ streamId, sessionId });
  } catch (error) {
    logError(error);
    console.error('Error creating stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

app.post('/streams/:streamId/sdp', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { answer } = req.body;
    const stream = activeStreams.get(streamId);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    await didService.handleSDP(streamId, stream.sessionId, answer);
    res.json({ success: true });
  } catch (error) {
    logError(error);
    console.error('Error handling SDP:', error);
    res.status(500).json({ error: 'Failed to handle SDP' });
  }
});

app.post('/streams/:streamId/ice', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { candidate, sdpMid, sdpMLineIndex } = req.body;
    const stream = activeStreams.get(streamId);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    await didService.handleICE(streamId, stream.sessionId, { candidate, sdpMid, sdpMLineIndex });
    res.json({ success: true });
  } catch (error) {
    logError(error);
    console.error('Error handling ICE candidate:', error);
    res.status(500).json({ error: 'Failed to handle ICE candidate' });
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
    logError(error);
    console.error('Error sending utterance:', error);
    res.status(500).json({ error: 'Failed to send utterance' });
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
    logError(error);
    console.error('Error deleting stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
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