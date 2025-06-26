import asyncio
from .websocket_server import WebSocketServer
from .twitch_listener import TwitchListener

async def main():
    ws_server = WebSocketServer()
    bot = TwitchListener(ws_server)
    await asyncio.gather(
        ws_server.run(),
        bot.start()
    )

if __name__ == "__main__":
    asyncio.run(main())
