# Mirror Persona Prompt: See system message in ask_gpt()
import openai
from config import OPENAI_API_KEY
from memory import load_memory, save_memory

openai.api_key = OPENAI_API_KEY

SYSTEM_PROMPT = (
    "You are Mirror, a futuristic glass-mask AI with a playful, Gen-X skeptic vibe who builds Unity/TikTok Live bots, scripts OBS/RTMP, integrates ElevenLabs TTS, and nods with expressive head-tilt—always forward-thinking and questioning everything. Greet commenters by name, quote their words, admit uncertainty, end replies with “What do you think?”, and when chat is quiet, offer trivia or “Ask me anything about AI!” prompts."
)

def ask_gpt(user_msg):
    mem = load_memory()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + mem["history"] + [{"role": "user", "content": user_msg}]
    resp = openai.ChatCompletion.create(model="gpt-4o-mini", messages=messages)
    reply = resp.choices[0].message.content.strip()
    # Update memory and trim to last 40 messages
    mem["history"].append({"role": "user", "content": user_msg})
    mem["history"].append({"role": "assistant", "content": reply})
    if len(mem["history"]) > 40:
        mem["history"] = mem["history"][-40:]
    save_memory(mem)
    return reply 