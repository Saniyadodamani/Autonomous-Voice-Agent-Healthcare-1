from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    SUPABASE_URL: str | None
    SUPABASE_SERVICE_KEY: str | None
    Groq_API_KEY: str | None
    VAPI_PRIVATE_KEY: str | None
    DEEPGRAM_API_KEY: str | None

    def validate(self) -> None:
        missing = [
            key
            for key, value in {
                "SUPABASE_URL": self.SUPABASE_URL,
                "SUPABASE_SERVICE_KEY": self.SUPABASE_SERVICE_KEY,
                "Groq_API_KEY": self.Groq_API_KEY,
                "VAPI_PRIVATE_KEY": self.VAPI_PRIVATE_KEY,
                "DEEPGRAM_API_KEY": self.DEEPGRAM_API_KEY,
            }.items()
            if not value
        ]
        if missing:
            raise ValueError(f"Missing required env vars: {', '.join(missing)}")


load_dotenv()

settings = Settings(
    SUPABASE_URL=os.getenv("SUPABASE_URL"),
    SUPABASE_SERVICE_KEY=os.getenv("SUPABASE_SERVICE_KEY"),
    Groq_API_KEY=os.getenv("Groq_API_KEY"),
    VAPI_PRIVATE_KEY=os.getenv("VAPI_PRIVATE_KEY"),
    DEEPGRAM_API_KEY=os.getenv("DEEPGRAM_API_KEY"),
)
