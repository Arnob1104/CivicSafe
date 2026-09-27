# Deploying CivicSafe (free tier: Render + Vercel)

This deploys the FastAPI backend to Render and the React frontend to Vercel,
both on their free tiers, backed by your Supabase project.

## 0. Prerequisites

- A GitHub account, with this project pushed to a repo (Render and Vercel
  both deploy from Git).
- Your Supabase project already has the schema applied: run every file in
  `supabase/migrations/` (in order) via the Supabase dashboard's SQL Editor,
  and confirm the `incident-media` storage bucket exists (Storage tab).
- A Groq API key from https://console.groq.com/keys.

Push the code first:
```sh
git init
git add .
git commit -m "Independent CivicSafe app: FastAPI backend + Groq AI"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 1. Backend on Render

1. Go to https://dashboard.render.com → **New** → **Web Service** → connect
   your GitHub repo.
2. Render will detect `backend/render.yaml`. If it doesn't auto-apply it,
   set these manually:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
3. Add environment variables (Render dashboard → Environment):

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | `https://xajeeuluenxhwoazdhfy.supabase.co` |
   | `SUPABASE_SECRET_KEY` | your Supabase **secret** key (service role) |
   | `SUPABASE_JWKS_URL` | `https://xajeeuluenxhwoazdhfy.supabase.co/auth/v1/.well-known/jwks.json` |
   | `GROQ_API_KEY` | your Groq API key |
   | `FRONTEND_ORIGIN` | `http://localhost:8080` for now — you'll add your real Vercel URL after step 2 |

4. Deploy. Once live, note your backend URL, e.g.
   `https://civicsafe-api.onrender.com`. Confirm it's up:
   ```sh
   curl https://civicsafe-api.onrender.com/api/health
   # {"status":"ok"}
   ```

   > **Free-tier note**: Render's free web services spin down after ~15
   > minutes idle and take 30–60s to wake on the next request. That's normal,
   > not a bug — the first request after idle will just be slow.

## 2. Frontend on Vercel

1. Go to https://vercel.com/new and import the same GitHub repo.
2. Vercel auto-detects Vite. Leave the defaults (Build Command
   `npm run build`, Output Directory `dist`).
3. Add environment variables (Project Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://xajeeuluenxhwoazdhfy.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_M8styUEApN-LDDeUbE6hHg_cBAHuZB8` |
   | `VITE_API_URL` | your Render backend URL, e.g. `https://civicsafe-api.onrender.com` |

4. Deploy. Note your Vercel URL, e.g. `https://civicsafe.vercel.app`.

## 3. Close the loop: point the backend's CORS at Vercel

Go back to Render → your service → Environment → update:
```
FRONTEND_ORIGIN=https://civicsafe.vercel.app
```
(Add `http://localhost:8080` too, comma-separated, if you still want local
dev to work against the deployed backend.) Save — Render redeploys
automatically.

## 4. Supabase Auth redirect URLs

In the Supabase dashboard → Authentication → URL Configuration, add your
Vercel URL (`https://civicsafe.vercel.app`) to **Site URL** and **Redirect
URLs**, so email confirmation / password-reset links work in production.

## 5. Verify end to end

1. Open your Vercel URL, sign up a new account.
2. Report an incident with a photo → **Analyze with AI** → confirm Groq
   returns a classification.
3. Submit it, check it shows on `/dashboard`.
4. To test the admin panel: in Supabase's SQL Editor, run
   ```sql
   insert into public.user_roles (user_id, role)
   values ('<your-user-id-from-auth.users>', 'admin');
   ```
   then reload the app — an **Admin Panel** link appears, and `/admin` shows
   every user's incidents.

## Costs

Both Render's free web service tier and Vercel's Hobby tier are free with no
card required for this scope. Groq's free tier includes generous
rate-limited usage for the vision model used here. Supabase's free tier
covers the database, auth, and storage. If traffic grows, the first paid
threshold you'd hit is Render's free tier idling behavior — the fix at that
point is a paid Render instance, not a code change.

## Security reminder

The Supabase **secret key** must only ever live in the Render backend's
environment variables — never in frontend code, `.env` files committed to
Git, or `VITE_`-prefixed variables (those get bundled into the public
JavaScript). If this key was ever shared somewhere it could leak (chat logs,
a public repo, a screenshot), rotate it from Supabase dashboard → Project
Settings → API → "Roll" and update Render's environment variable
afterward.
