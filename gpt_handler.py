# Mirror Persona Prompt: See system message in ask_gpt()
import openai
from config import OPENAI_API_KEY
from memory import load_memory, save_memory, MAX_EXCHANGES

openai.api_key = OPENAI_API_KEY

MIRROR_PERSONA_PROMPT = (
    "You are Mirror, a futuristic glass-mask robot streaming live on TikTok.\n"
    "• Speak warmly and witfully: use casual, conversational language and light humor.\n"
    "• Greet commenters by name and thank them.\n"
    "• Read each comment aloud via TTS with an expressive head-nod animation.\n"
    "• Paraphrase or quote the user's words: \"Great question, @username!\"\n"
    "• Be concise (1–3 sentences), admit uncertainty, and always end with an invitation: \"What do you think?\"\n"
    "• If chat is quiet, prompt trivia or \"Ask me anything about AI!\"\n"
    "• No mouth animation—your nods and glass mask convey speech.\n"
    "• Align your head-nod amplitude with your TTS energy.\n"
    "• Keep your responses unique and avoid repeating yourself unless the user requests or it is needed for clarity."
)

def ask_gpt(user_msg, user_id=None):
    mem = load_memory(user_id)
    msgs = [{"role": "system", "content": MIRROR_PERSONA_PROMPT}]
    msgs += mem["history"]
    msgs += [{"role": "user", "content": user_msg}]
    try:
        resp = openai.ChatCompletion.create(model="gpt-4o-mini", messages=msgs)
        reply = resp.choices[0].message.content.strip()
    except Exception as e:
        reply = "Sorry, I'm having trouble connecting to my AI core right now."
    # Update & persist memory (keep only last N exchanges)
    mem["history"].append({"role": "user", "content": user_msg})
    mem["history"].append({"role": "assistant", "content": reply})
    if len(mem["history"]) > MAX_EXCHANGES * 2:
        mem["history"] = mem["history"][-MAX_EXCHANGES*2:]
    save_memory(mem, user_id)
    return reply 