# Mirror.exe - TikTok Live AI Avatar

A real-time AI avatar chatbot for TikTok Live streams, powered by D-ID for video generation and OpenAI's ChatGPT for conversation.

## Features

- Real-time AI avatar streaming using D-ID
- Natural conversation powered by ChatGPT
- WebRTC-based video streaming
- TikTok Live integration via OBS
- Automatic reconnection and error handling
- QR code overlay for easy access

## Prerequisites

- Node.js 18+ and npm
- D-ID API key
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
D_ID_KEY=your_d_id_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
D_ID_AVATAR_URL=https://your-avatar-image-url.jpg
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
4. Viewers can interact with the avatar through chat messages

## Development

- `npm run dev` - Start server with hot reload
- `npm start` - Start production server

## Architecture

- `src/server.js` - Express server and WebSocket handling
- `src/didService.js` - D-ID API integration
- `src/chatService.js` - OpenAI ChatGPT integration
- `src/public/` - Frontend files
  - `index.html` - OBS Browser Source UI
  - `app.js` - WebRTC and chat handling

## Error Handling

The system includes automatic:
- WebRTC reconnection
- Stream session recovery
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