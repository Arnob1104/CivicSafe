import os
from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


SUPABASE_URL = _require("SUPABASE_URL")
SUPABASE_SECRET_KEY = _require("SUPABASE_SECRET_KEY")
SUPABASE_JWKS_URL = os.getenv(
    "SUPABASE_JWKS_URL", f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
)

# Groq API key for AI incident classification. Not required at import time so
# the server can still boot and report a clear error from the endpoint itself.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

# Comma-separated list of allowed origins for CORS, e.g.
# "http://localhost:8080,https://civicsafe.vercel.app"
FRONTEND_ORIGINS = [
    o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:8080").split(",") if o.strip()
]
