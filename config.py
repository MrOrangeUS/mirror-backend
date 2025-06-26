# config.py
import os
from dotenv import load_dotenv
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
ELEVEN_KEY = os.getenv("ELEVEN_API_KEY")
ELEVEN_VOICE_ID = os.getenv("ELEVEN_VOICE_ID")
TWITCH_CHANNEL = os.getenv("TWITCH_CHANNEL")
TWITCH_OAUTH = os.getenv("TWITCH_OAUTH_TOKEN") 