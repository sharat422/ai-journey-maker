import os
import requests
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()
print(f"Loading .env from: {os.path.abspath(env_path)}")
load_dotenv(env_path)

print("VITE Environment Variables:")
for k, v in os.environ.items():
    if k.startswith("VITE_"):
        print(f"{k}: {v[:10]}...{v[-5:] if len(v) > 10 else ''}")

CLAUDE_API_KEY = os.getenv("VITE_CLAUDE_API_KEY")
if CLAUDE_API_KEY:
    print(f"Key Hex: {CLAUDE_API_KEY.encode().hex()}")
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"

prompt = "Hello, tell me a joke."
headers = {
    "x-api-key": CLAUDE_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
}
payload = {
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 1024,
    "messages": [
        {"role": "user", "content": prompt}
    ],
    "system": "You are a helpful assistant."
}

response = requests.post(CLAUDE_API_URL, headers=headers, json=payload)
print(f"Status Code: {response.status_code}")
if response.status_code != 200:
    print("Error Response JSON:")
    try:
        print(response.json())
    except Exception as e:
        print(f"Non-JSON error: {response.text}")
else:
    print("Success!")
    try:
        print(response.json()["content"][0]["text"])
    except Exception as e:
        print(f"Successful status but failed to parse content: {response.text}")
