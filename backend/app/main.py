from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.routers import incidents, profile, ai, me

app = FastAPI(title="CivicSafe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)
app.include_router(profile.router)
app.include_router(ai.router)
app.include_router(me.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
