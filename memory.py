# memory.py
import json, os

MEM_PATH = "data/memory.json"

def load_memory():
    if os.path.exists(MEM_PATH):
        with open(MEM_PATH, "r") as f:
            return json.load(f)
    return {"history": []}

def save_memory(mem):
    os.makedirs(os.path.dirname(MEM_PATH), exist_ok=True)
    with open(MEM_PATH, "w") as f:
        json.dump(mem, f, indent=2) 