# Mirror App

Mirror connects Twitch chat to a Unity avatar with AI-powered responses and lip-synced speech. Python handles chat, GPT and TTS, while Unity plays the audio and animates the avatar.

## Setup

### 1. Install Python Dependencies
```bash
cd python
pip install -r requirements.txt
```

Create a `.env` file in the project root with:
```
TWITCH_CHANNEL=your_channel
TWITCH_OAUTH_TOKEN=oauth:token_here
OPENAI_API_KEY=sk-...
ELEVEN_API_KEY=your_eleven_key
ELEVEN_VOICE_ID=your_voice_id
```

### 2. Run the Backend
```bash
python -m python.main
```
This starts the Twitch listener and the WebSocket server on `ws://localhost:8765`.

### 3. Unity Project
1. Import the **NativeWebSocket** package from GitHub (`https://github.com/endel/NativeWebSocket.git`).
2. Copy `Assets/Scripts/NativeWebSocketReceiver.cs` and `Assets/Scripts/HeadMovementController.cs` into your Unity project's `Assets/Scripts/` folder.
3. Add one `AudioSource` to your avatar root and attach **NativeWebSocketReceiver**.
4. Attach **HeadMovementController** to the avatar head bone and assign the same `AudioSource`.
5. Ensure the scene contains only one `AudioListener` (on the Main Camera).
6. Press Play to connect.

Incoming chat/gift/follow events and AI responses are logged. When an audio event arrives, the MP3 is streamed and played back with simple head nods based on volume.

## File Structure
```
python/
  config.py
  gpt_handler.py
  tts_handler.py
  twitch_listener.py
  websocket_server.py
  main.py
  requirements.txt
Assets/
  Scripts/NativeWebSocketReceiver.cs
  Scripts/HeadMovementController.cs
public/audio/              # generated TTS files
```

## Notes
- Chat messages are rate limited to 3 per user per 30 s and duplicate messages within 10 s are ignored.
- Gifts are only broadcast when the amount is ≥100 bits.
- Audio files are saved under `public/audio/` for Unity to load.
