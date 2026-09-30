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

## features
• AI incident detection: users upload photos or video and the AI identifies the incident type and auto-generates a report
description.
• One-click reporting: the report is submitted with the user’s location straight to the admin dashboard.
• Admin workflow: admins review each report and set its status to Pending, Running, Resolved or Closed.
