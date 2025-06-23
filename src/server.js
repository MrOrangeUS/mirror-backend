require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const ttsService = require('./ttsService');
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

// Helper function to log errors
function logError(error) {
  console.error('Error:', error);
}

// Routes
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chatService.getResponse(message);
    
    // Generate TTS audio for the response
    const audioPath = await ttsService.getSpeechFrom11Labs(response);
    
    // Send response with audio path
    res.json({ 
      response,
      audio: {
        type: "audio",
        path: audioPath
      }
    });
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