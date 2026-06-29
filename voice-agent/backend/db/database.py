from __future__ import annotations

from supabase import Client, create_client

from config import settings


def get_db() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

