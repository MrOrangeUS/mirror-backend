import asyncio
import websockets
import json

PORT = 8765
clients = set()

async def handler(websocket, path):
    clients.add(websocket)
    try:
        async for message in websocket:
            pass  # No incoming messages expected
    finally:
        clients.remove(websocket)

async def broadcast(msg):
    if clients:
        await asyncio.wait([client.send(json.dumps(msg)) for client in clients])

async def main():
    async with websockets.serve(handler, "0.0.0.0", PORT):
        print(f"WebSocket server started on ws://localhost:{PORT}")
        # Example: send test messages every 10 seconds
        while True:
            await asyncio.sleep(10)
            await broadcast({"type": "text", "text": "Hello from Python WebSocket!"})
            await broadcast({"type": "audio", "path": "C:/path/to/test.mp3"})

if __name__ == "__main__":
    asyncio.run(main()) 