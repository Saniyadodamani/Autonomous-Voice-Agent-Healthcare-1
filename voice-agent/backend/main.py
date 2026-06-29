from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.crud import get_all_appointments, get_available_slots
from db.database import get_db
from routes.vapi_webhook import router as vapi_router


app = FastAPI(title="CarePoint Clinic Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vapi_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/slots")
async def slots(date: str = Query(..., description="YYYY-MM-DD")):
    db = get_db()
    return get_available_slots(db, date)


@app.get("/bookings/all")
async def bookings_all():
    db = get_db()
    return get_all_appointments(db)


@app.on_event("startup")
async def _startup():
    settings.validate()
    print("✅ CarePoint backend ready")

