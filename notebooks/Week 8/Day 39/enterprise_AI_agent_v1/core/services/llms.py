import os
from dotenv import load_dotenv
load_dotenv()

LLMs = {
    "groq": {
        "baseUrl": "https://api.groq.com/openai/v1",
        "apikey": os.getenv("GROQ_API_KEY"),
        "model": "openai/gpt-oss-120b"
    },
    "openrouter": {
        "baseUrl": "https://openrouter.ai/api/v1",
        "apikey": os.getenv("OPEN_ROUTER_KEY"),
        "model": "nvidia/nemotron-3.5-lightning:free"
    }
}