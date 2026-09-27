# CivicSafe backend (FastAPI)

Handles: incident CRUD, admin status updates, profile updates, and AI image
classification (Groq). Auth is verified from the Supabase-issued JWT (no
session state is kept in the backend itself — Supabase Auth remains the
identity provider, the frontend just sends the access token on every call).

## Setup

```sh
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in your real values
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/api/health to confirm it's running, and
http://localhost:8000/docs for the interactive API docs.

## Environment variables

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SECRET_KEY` | Supabase dashboard → Project Settings → API (service role / secret key — **never** expose this to the frontend) |
| `SUPABASE_JWKS_URL` | `<SUPABASE_URL>/auth/v1/.well-known/jwks.json` |
| `GROQ_API_KEY` | https://console.groq.com/keys |
| `FRONTEND_ORIGIN` | comma-separated list of allowed origins for CORS |

## Notes

- The backend uses the Supabase **service role** key, which bypasses Row
  Level Security — every route manually checks that the requester owns the
  row (or is an admin) before returning or mutating it.
- Admin status is looked up from the `user_roles` table on every admin
  request; there is no separate admin login.
