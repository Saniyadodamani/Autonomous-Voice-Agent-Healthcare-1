from __future__ import annotations

from typing import Any

from supabase import Client


def get_available_slots(db: Client, date: str) -> list[dict]:
    try:
        res = (
            db.table("slots")
            .select("*")
            .eq("date", date)
            .eq("is_available", True)
            .order("time", desc=False)
            .execute()
        )
        return list(res.data or [])
    except Exception as e:
        raise RuntimeError(f"Failed to get available slots: {e}") from e


def is_slot_available(db: Client, date: str, time: str) -> bool:
    try:
        res = (
            db.table("slots")
            .select("id,is_available")
            .eq("date", date)
            .eq("time", time)
            .limit(1)
            .execute()
        )
        row = (res.data or [None])[0]
        return bool(row and row.get("is_available") is True)
    except Exception as e:
        raise RuntimeError(f"Failed to check slot availability: {e}") from e


def mark_slot_booked(db: Client, date: str, time: str) -> None:
    try:
        (
            db.table("slots")
            .update({"is_available": False})
            .eq("date", date)
            .eq("time", time)
            .execute()
        )
    except Exception as e:
        raise RuntimeError(f"Failed to mark slot booked: {e}") from e


def is_clinic_open(db: Client, date: str) -> bool:
    try:
        res = db.table("slots").select("id").eq("date", date).limit(1).execute()
        return bool(res.data)
    except Exception as e:
        raise RuntimeError(f"Failed to check clinic open: {e}") from e


def create_appointment(db: Client, data: dict) -> dict:
    try:
        insert_res = db.table("appointments").insert(data).execute()
        created = (insert_res.data or [None])[0]
        if not created:
            raise RuntimeError("No row returned from appointments insert")
        mark_slot_booked(db, str(created["date"]), str(created["time"])[:5])
        return created
    except Exception as e:
        raise RuntimeError(f"Failed to create appointment: {e}") from e


def upsert_patient(db: Client, name: str, phone: str, age: int | None, gender: str | None) -> dict:
    try:
        existing_res = db.table("patients").select("*").eq("phone", phone).limit(1).execute()
        existing = (existing_res.data or [None])[0]
        if existing:
            updated_res = (
                db.table("patients")
                .update({"name": name, "age": age, "gender": gender, "is_existing": True})
                .eq("id", existing["id"])
                .execute()
            )
            patient = (updated_res.data or [existing])[0]
            return {"patient": patient, "is_new": False}

        insert_payload: dict[str, Any] = {"name": name, "phone": phone, "age": age, "gender": gender}
        inserted_res = db.table("patients").insert(insert_payload).execute()
        patient = (inserted_res.data or [None])[0]
        if not patient:
            raise RuntimeError("No row returned from patients insert")
        return {"patient": patient, "is_new": True}
    except Exception as e:
        raise RuntimeError(f"Failed to upsert patient: {e}") from e


def create_emergency_alert(db: Client, data: dict) -> dict:
    try:
        res = db.table("emergency_alerts").insert(data).execute()
        created = (res.data or [None])[0]
        if not created:
            raise RuntimeError("No row returned from emergency_alerts insert")
        return created
    except Exception as e:
        raise RuntimeError(f"Failed to create emergency alert: {e}") from e


def get_all_appointments(db: Client) -> list[dict]:
    try:
        res = db.table("appointments").select("*").order("created_at", desc=True).execute()
        return list(res.data or [])
    except Exception as e:
        raise RuntimeError(f"Failed to get all appointments: {e}") from e

