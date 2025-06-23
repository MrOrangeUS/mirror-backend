# Mirror.exe - TikTok Live AI Chatbot

A real-time AI chatbot for TikTok Live streams, powered by ElevenLabs for text-to-speech and OpenAI's ChatGPT for conversation.

## Features

- Real-time AI chatbot responses using ChatGPT
- High-quality text-to-speech using ElevenLabs
- TikTok Live integration via OBS
- Automatic error handling and logging
- QR code overlay for easy access

## Prerequisites

- Node.js 18+ and npm
- ElevenLabs API key
- OpenAI API key
- OBS Studio
- TikTok Live account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mirror-backend.git
cd mirror-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` and add your API keys:
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id_here
OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the server:
```bash
npm start
```

## OBS Setup

1. Open OBS Studio
2. Add a new Browser Source
3. Set the URL to `http://localhost:3000`
4. Set the width to 1080 and height to 1920
5. Check "Shutdown source when not visible"
6. Click OK

## TikTok Live Setup

1. Go to your TikTok Creator Portal
2. Start a new live stream
3. Copy the RTMP URL and Stream Key
4. In OBS:
   - Go to Settings → Stream
   - Select "Custom" as the service
   - Paste the RTMP URL
   - Paste the Stream Key
5. Click "Start Streaming"

## Usage

1. Start the server: `npm start`
2. Open OBS and start the Browser Source
3. Start streaming to TikTok Live
4. Viewers can interact with the chatbot through chat messages

## Development

- `npm run dev` - Start server with hot reload
- `npm start` - Start production server

## Architecture

- `src/server.js` - Express server and API endpoints
- `src/chatService.js` - OpenAI ChatGPT integration
- `src/ttsService.js` - ElevenLabs TTS integration
- `src/public/` - Frontend files
  - `index.html` - OBS Browser Source UI
  - `app.js` - Chat handling

## Error Handling

The system includes automatic:
- API error handling
- Error logging
- Status display

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

---

Note: The chatbot system prompt was updated in June 2025 to make responses briefer (1–2 sentences) and more nonchalant/witty by default. 