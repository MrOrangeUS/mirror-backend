import time
from twitchio.ext import commands
from .config import TWITCH_CHANNEL, TWITCH_OAUTH_TOKEN
from .gpt_handler import generate_response
from .tts_handler import text_to_speech

RATE_LIMIT = 3  # messages per 30s
DUP_WINDOW = 10  # seconds

class TwitchListener(commands.Bot):
    def __init__(self, ws_server):
        super().__init__(token=TWITCH_OAUTH_TOKEN, prefix="!", initial_channels=[TWITCH_CHANNEL])
        self.ws = ws_server
        self.user_times = {}
        self.last_msg = {}

    def _allow(self, user: str, text: str) -> bool:
        now = time.time()
        times = [t for t in self.user_times.get(user, []) if now - t < 30]
        if len(times) >= RATE_LIMIT:
            return False
        last = self.last_msg.get(user)
        if last and last[0] == text and now - last[1] < DUP_WINDOW:
            return False
        times.append(now)
        self.user_times[user] = times
        self.last_msg[user] = (text, now)
        return True

    async def event_message(self, message):
        if message.echo or not message.content:
            return
        user = message.author.name
        text = message.content.strip()
        if not self._allow(user, text):
            return
        await self.ws.broadcast({"type": "chat", "user": user, "text": text})

        event_text = f"User {user} says: {text}"
        reply = await generate_response(event_text)
        await self.ws.broadcast({"type": "response", "text": reply})
        path = text_to_speech(reply)
        await self.ws.broadcast({"type": "audio", "path": path})

    async def event_raw_usernotice(self, channel, tags):
        msg_id = tags.get("msg-id")
        user = tags.get("login", "")
        if msg_id == "sub":
            await self.ws.broadcast({"type": "follow", "user": user})
        elif msg_id in {"subgift", "rewardgift"}:
            amount = int(tags.get("msg-param-mass-gift-count", "1"))
            if amount >= 100:
                await self.ws.broadcast({
                    "type": "gift",
                    "user": user,
                    "gift": tags.get("msg-param-sub-plan-name", "gift"),
                    "amount": amount,
                })
