import asyncio
import websockets
import json

class WebSocketServer:
    def __init__(self, port: int = 8765):
        self.port = port
        self.clients: set[websockets.WebSocketServerProtocol] = set()

    async def handler(self, websocket, path):
        self.clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    async def broadcast(self, msg: dict):
        if not self.clients:
            return
        data = json.dumps(msg)
        await asyncio.gather(*(client.send(data) for client in self.clients))

    async def run(self):
        async with websockets.serve(self.handler, "0.0.0.0", self.port):
            print(f"WebSocket server listening on ws://localhost:{self.port}")
            await asyncio.Future()
