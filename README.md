# CivicSafe

An AI-powered public safety incident reporting platform.

- **Frontend**: React + Vite + TypeScript, shadcn-ui, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database & Auth & Storage**: Supabase (Postgres, Auth, Storage)
- **AI classification**: Groq (Llama 4 Scout vision model)

This is an independent, self-hosted project (no third-party app-builder platform involved).

## Project structure

```
civicsafe/
├── src/                # React frontend
├── supabase/           # Supabase SQL migrations (Postgres schema, RLS policies, storage bucket)
├── backend/            # FastAPI backend (AI classification + incident/profile API)
└── .env.example        # Frontend environment variables
```

## Local development

### 1. Supabase setup
Run the SQL files in `supabase/migrations/` against your Supabase project (SQL Editor, in order), and confirm the `incident-media` storage bucket was created.

### 2. Backend (FastAPI)
See `backend/README.md`.

### 3. Frontend
```sh
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Deployment

See `DEPLOYMENT.md` for a full guide to deploying the backend on Render and the frontend on Vercel, both on free tiers.
