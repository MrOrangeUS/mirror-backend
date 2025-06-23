const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

// Use dynamic import for fetch to support CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getSpeechFrom11Labs(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
  console.time('TTS Fetch');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.5 }
    })
  });
  console.timeEnd('TTS Fetch');

  if (!response.ok) {
    throw new Error(`11Labs TTS failed: ${response.statusText}`);
  }

  // Use arrayBuffer to avoid deprecation warning
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const tempPath = path.join(tempDir, `tts_${Date.now()}.mp3`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

module.exports = { getSpeechFrom11Labs }; 