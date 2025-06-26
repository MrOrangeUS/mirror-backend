# MyAvatarStreamer - Standalone TikTok Live Unity Streamer

## Quick Start

1. Clone this repo and open in Unity 2022.3 LTS.
2. Place your ffmpeg.exe in Assets/StreamingAssets/.
3. Copy stream.env.sample to stream.env and fill in your TikTok RTMP URL and Stream Key.
4. Build for Windows Standalone (File > Build Settings).
5. Run MyAvatarStreamer.exe. No UI, no overlays—just your avatar and clean audio/video to TikTok Live.

## Notes

- No on-screen text or UI.
- Logs are written to Logs/stream.log.
- Audio and video are piped to ffmpeg for RTMP streaming.
- Head-nod and audio are controlled via your backend. 