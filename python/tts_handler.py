import os
import uuid
import requests
from .config import ELEVEN_API_KEY, ELEVEN_VOICE_ID, AUDIO_DIR

ELEVEN_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVEN_VOICE_ID}"

headers = {
    "xi-api-key": ELEVEN_API_KEY,
    "accept": "audio/mpeg",
    "Content-Type": "application/json",
}

def text_to_speech(text: str) -> str:
    os.makedirs(AUDIO_DIR, exist_ok=True)
    file_name = f"{uuid.uuid4()}.mp3"
    file_path = os.path.join(AUDIO_DIR, file_name)

    payload = {"text": text, "model_id": "eleven_multilingual_v2"}
    response = requests.post(ELEVEN_URL, json=payload, headers=headers, timeout=30)
    response.raise_for_status()

    with open(file_path, "wb") as f:
        f.write(response.content)

    return file_path
