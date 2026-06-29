from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Request

from agents.urgency import evaluate_urgency
from db.crud import (
    create_appointment,
    create_emergency_alert,
    get_available_slots,
    is_clinic_open,
    is_slot_available,
)
from db.database import get_db


router = APIRouter()


DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _validate_date(date_str: str) -> datetime:
    if not date_str or not DATE_RE.match(date_str):
        raise ValueError("Invalid date format. Use YYYY-MM-DD.")
    return datetime.strptime(date_str, "%Y-%m-%d")


def _format_day(date_obj: datetime) -> str:
    return date_obj.strftime("%A")


def _format_time_hhmm_to_ampm(hhmm: str) -> str:
    dt = datetime.strptime(hhmm, "%H:%M")
    # Windows strftime doesn't support "%-I"; do it manually.
    hour = dt.hour % 12
    hour = 12 if hour == 0 else hour
    suffix = "AM" if dt.hour < 12 else "PM"
    return f"{hour}:{dt.minute:02d} {suffix}"


def normalize_time(time_str: str) -> str | None:
    if not time_str:
        return None
    s = str(time_str).strip().upper()
    s = re.sub(r"\s+", " ", s)

    m = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$", s)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or "00")
        ampm = m.group(3)
        if hour < 1 or hour > 12 or minute < 0 or minute > 59:
            return None
        if ampm == "AM":
            hour = 0 if hour == 12 else hour
        else:
            hour = 12 if hour == 12 else hour + 12
        return f"{hour:02d}:{minute:02d}"

    m2 = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?$", s)
    if m2:
        hour = int(m2.group(1))
        minute = int(m2.group(2))
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            return None
        return f"{hour:02d}:{minute:02d}"

    return None


def _extract_function_call(payload: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
    # Vapi payloads vary; handle common shapes.
    msg = payload.get("message") or payload.get("messages") or payload
    if isinstance(msg, dict):
        msg_type = msg.get("type")
        if msg_type == "function-call":
            return msg.get("functionName"), (msg.get("parameters") or {})
        if msg.get("toolCall") and isinstance(msg["toolCall"], dict):
            tc = msg["toolCall"]
            return tc.get("name"), (tc.get("arguments") or {})

    if isinstance(payload.get("message"), dict) and payload["message"].get("type") == "tool-call":
        tc = payload["message"].get("toolCall") or {}
        return tc.get("name"), (tc.get("arguments") or {})

    # Some integrations send { type, functionName, parameters } at top-level.
    if payload.get("type") == "function-call":
        return payload.get("functionName"), (payload.get("parameters") or {})

    return None, {}


@router.post("/vapi/webhook")
async def vapi_webhook(request: Request) -> Any:
    payload = await request.json()
    fn_name, params = _extract_function_call(payload)

    if not fn_name:
        return {"result": "OK"}

    if fn_name == "check_availability":
        date = params.get("date")
        try:
            date_obj = _validate_date(date)
            db = get_db()
            if not is_clinic_open(db, date):
                day = _format_day(date_obj)
                next_day = date_obj + timedelta(days=1)
                while next_day.weekday() == 6:  # Sunday
                    next_day += timedelta(days=1)
                return {
                    "result": f"Clinic is closed on {day}. Try {next_day.strftime('%A')}."
                }

            slots = get_available_slots(db, date)
            if not slots:
                return {"result": f"Fully booked on {date}. Try another date."}

            times = []
            for s in slots:
                t = str(s.get("time", ""))[:5]
                if t:
                    times.append(_format_time_hhmm_to_ampm(t))
            times_str = ", ".join(times)
            return {"result": f"Available on {date}: {times_str}. Which works for you?"}
        except Exception as e:
            return {"result": f"Sorry, I couldn't check availability: {e}"}

    if fn_name == "book_appointment":
        try:
            required = ["patient_name", "phone", "date", "time"]
            for r in required:
                if not params.get(r):
                    raise ValueError(f"Missing required field: {r}")

            patient_name = str(params.get("patient_name")).strip()
            phone = str(params.get("phone")).strip()
            date = str(params.get("date")).strip()
            _validate_date(date)

            normalized_time = normalize_time(str(params.get("time")))
            if not normalized_time:
                raise ValueError("Invalid time format.")

            db = get_db()

            if not is_slot_available(db, date, normalized_time):
                slots = get_available_slots(db, date)
                if slots:
                    next_time = str(slots[0].get("time"))[:5]
                    return {"result": f"That time is taken. Next available is {next_time}. Would you like that?"}
                return {"result": "That time is taken, and there are no slots left that day. Try another date."}

            symptoms = str(params.get("symptoms") or "").strip()
            age = params.get("age")
            try:
                age_int = int(age) if age is not None else None
            except Exception:
                age_int = None
            gender = params.get("gender") if "gender" in params else None

            urgency_in = (params.get("urgency") or "normal").strip().lower()
            if urgency_in not in {"normal", "urgent", "emergency"}:
                urgency_in = "normal"
            evaluated = evaluate_urgency(symptoms, age=int(age_int or 0))
            urgency = evaluated if (not params.get("urgency") or urgency_in == "normal") else urgency_in
            if evaluated == "emergency":
                urgency = "emergency"

            from db.crud import upsert_patient  # local import to match required module layout

            upsert_patient(db, patient_name, phone, age_int, gender)

            appt_payload: dict[str, Any] = {
                "patient_name": patient_name,
                "phone": phone,
                "age": age_int,
                "gender": gender,
                "symptoms": symptoms,
                "symptom_duration": params.get("symptom_duration"),
                "urgency": urgency,
                "department": params.get("department") or "General",
                "doctor": "Dr. Sharma",
                "date": date,
                "time": normalized_time,
                "is_followup": bool(params.get("is_followup") or False),
                "notes": params.get("notes"),
                "session_id": params.get("session_id"),
                "status": "confirmed",
            }

            created = create_appointment(db, appt_payload)
            booking_id = str(created.get("id", ""))[:8]
            time_display = str(created.get("time", ""))[:5]
            result_text = (
                f"Confirmed! {patient_name}, {date} at {time_display} with Dr. Sharma. "
                f"Booking ID: {booking_id}."
            )
            return {
                "result": result_text,
                "booking": {
                    "patient_name": patient_name,
                    "date": date,
                    "time": time_display,
                    "doctor": "Dr. Sharma",
                    "urgency": urgency,
                    "booking_id": booking_id,
                },
                "urgency": urgency,
            }
        except Exception as e:
            return {"result": f"Sorry, I couldn't book that right now due to a technical issue: {e}"}

    if fn_name == "alert_emergency":
        try:
            patient_name = str(params.get("patient_name") or "").strip() or "Unknown"
            phone = str(params.get("phone") or "").strip() or None
            symptoms = str(params.get("symptoms") or "").strip()
            if not symptoms:
                raise ValueError("Missing required field: symptoms")
            age = params.get("age")
            try:
                age_int = int(age) if age is not None else None
            except Exception:
                age_int = None

            db = get_db()
            created = create_emergency_alert(
                db,
                {
                    "patient_name": patient_name,
                    "phone": phone,
                    "age": age_int,
                    "symptoms": symptoms,
                    "resolved": False,
                },
            )
            print(f"🚨 Emergency alert created: {created.get('id')}")
            return {
                "result": "Emergency alert sent to on-call doctor. Please call 108 or go to nearest ER immediately."
            }
        except Exception as e:
            return {"result": f"Sorry, I couldn't send the emergency alert: {e}"}

    return {"result": "Unknown function."}

