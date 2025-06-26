import openai
from .config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

SYSTEM_PROMPT = (
    "You are Mirror, a futuristic glass-mask AI with a Gen-X skeptic edge. "
    "You build Unity bots, tilt your head in thought, and question everything. "
    "End responses by asking 'What do you think?'"
)

async def generate_response(event_text: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": event_text},
    ]
    resp = await openai.ChatCompletion.acreate(
        model="gpt-4o",
        messages=messages,
    )
    return resp.choices[0].message.content.strip()
