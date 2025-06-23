# memory.py
import json, os

MEM_PATH = "data/memory.json"
MAX_EXCHANGES = 20  # 20 user+assistant pairs

def load_memory(user_id=None):
    if not os.path.exists(MEM_PATH):
        return {"history": []} if not user_id else {}
    with open(MEM_PATH, "r") as f:
        try:
            data = json.load(f)
        except Exception:
            data = {}
    if user_id:
        return data.get(user_id, {"history": []})
    return data if "history" in data else {"history": []}

def save_memory(mem, user_id=None):
    os.makedirs(os.path.dirname(MEM_PATH), exist_ok=True)
    if user_id:
        # Load all, update just this user
        all_mem = {}
        if os.path.exists(MEM_PATH):
            with open(MEM_PATH, "r") as f:
                try:
                    all_mem = json.load(f)
                except Exception:
                    all_mem = {}
        all_mem[user_id] = mem
        with open(MEM_PATH, "w") as f:
            json.dump(all_mem, f, indent=2)
    else:
        with open(MEM_PATH, "w") as f:
            json.dump(mem, f, indent=2) 