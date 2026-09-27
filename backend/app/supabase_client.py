from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY

# Server-side client using the secret (service role) key.
# This bypasses Row Level Security, so every query in the routers MUST
# manually enforce ownership / admin checks (see app/security.py).
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
