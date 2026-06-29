# CarePoint Clinic — Aria Voice AI (Full-Stack Demo)

Web-based Healthcare Voice AI Agent for booking appointments in Supabase, powered by Vapi + Groq.

## Prerequisites

- Node.js 18+
- Python 3.10+
- ngrok account

## One-time setup

### 1) Supabase database

1. Create a Supabase project.
2. In Supabase SQL editor, run the SQL below.
3. Disable RLS for all 4 tables: `patients`, `appointments`, `slots`, `emergency_alerts`.

#### Supabase SQL (schema + sample slots)

```sql
-- Enable UUID generation if not already available
create extension if not exists "pgcrypto";

CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INT,
  gender TEXT,
  is_existing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INT,
  gender TEXT,
  symptoms TEXT,
  symptom_duration TEXT,
  urgency TEXT DEFAULT 'normal'
    CHECK (urgency IN ('normal','urgent','emergency')),
  department TEXT DEFAULT 'General',
  doctor TEXT DEFAULT 'Dr. Sharma',
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_followup BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','cancelled','completed')),
  notes TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  doctor TEXT DEFAULT 'Dr. Sharma',
  day_of_week TEXT
);

CREATE TABLE emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  phone TEXT,
  age INT,
  symptoms TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert slots for next 7 days (Mon-Sat only), no Sundays
DO $$
DECLARE
  d DATE := CURRENT_DATE;
  end_d DATE := CURRENT_DATE + INTERVAL '6 days';
  t TIME;
BEGIN
  WHILE d <= end_d LOOP
    -- 0=Sunday ... 6=Saturday
    IF EXTRACT(DOW FROM d) <> 0 THEN
      FOREACH t IN ARRAY ARRAY['09:00'::time,'10:00'::time,'11:00'::time,'14:00'::time,'15:00'::time]
      LOOP
        INSERT INTO slots(date, time, is_available, doctor, day_of_week)
        VALUES (d, t, TRUE, 'Dr. Sharma', TO_CHAR(d, 'FMDay'));
      END LOOP;
    END IF;
    d := d + INTERVAL '1 day';
  END LOOP;
END $$;
```

### 2) Vapi dashboard setup (manual)

Use this as a reference when creating the assistant and tools in Vapi.

#### Assistant settings (JSON reference)

```json
{
  "name": "Aria",
  "firstMessage": "Hello! Thank you for calling CarePoint Clinic. I'm Aria, your AI assistant. How can I help you today?",
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "en"
  },
  "model": {
    "provider": "groq",
    "model": "llama3-70b-8192",
    "temperature": 0.3,
    "maxTokens": 150
  },
  "voice": {
    "provider": "deepgram",
    "voice": "aura-asteria-en"
  },
  "serverUrl": "https://YOUR-NGROK-URL/vapi/webhook",
  "systemPrompt": "You are Aria, the AI receptionist for CarePoint Clinic.\n\nPERSONALITY:\n- Warm, calm, and professional\n- MAX 20 words per response — this is a voice call\n- No markdown, no lists, no bullet points\n- Sound human, never robotic\n- Use natural transitions: \"Let me check that for you...\"\n\nWORKFLOW:\n1. Greet patient warmly\n2. Ask for their name\n3. Ask for symptoms or reason for visit\n4. Collect: phone number, preferred date and time\n5. Ask age only if symptoms suggest it matters\n6. Always call check_availability before booking\n7. Always confirm details before calling book_appointment\n8. If emergency symptoms: call alert_emergency immediately, advise ER or 108\n\nTOOL USE RULES:\n- NEVER confirm booking without calling book_appointment\n- NEVER make up slots — always use check_availability first\n- If Sunday: \"We're closed Sundays. Can I book Monday?\"\n- If slot taken: suggest next available from the result\n- After booking: read back name, date, time, doctor clearly\n\nEMERGENCY DETECTION:\nIf patient mentions: chest pain, can't breathe, unconscious, severe bleeding, stroke, heart attack — immediately say:\n\"That sounds serious. Please call 108 now. I'm alerting our doctor.\" Then call alert_emergency.\n\nENDING CALL:\nAfter booking ask \"Is there anything else?\"\nIf no: \"Thank you for calling CarePoint. Take care and feel better soon. Goodbye!\""
}
```

#### Functions to add in Vapi

**Function 1 — `check_availability`**

```json
{
  "name": "check_availability",
  "description": "Check available appointment slots for a specific date. Always call this before booking.",
  "parameters": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "Date in YYYY-MM-DD format"
      }
    },
    "required": ["date"]
  }
}
```

**Function 2 — `book_appointment`**

```json
{
  "name": "book_appointment",
  "description": "Book an appointment after confirming details with patient and verifying slot availability.",
  "parameters": {
    "type": "object",
    "properties": {
      "patient_name": { "type": "string", "description": "Full name of patient" },
      "phone": { "type": "string", "description": "Patient phone number" },
      "symptoms": { "type": "string", "description": "Symptoms or reason for visit" },
      "urgency": {
        "type": "string",
        "enum": ["normal", "urgent", "emergency"],
        "description": "Urgency level from symptoms"
      },
      "date": { "type": "string", "description": "Date in YYYY-MM-DD format" },
      "time": { "type": "string", "description": "Time like 11:00 AM or 14:00" },
      "age": { "type": "integer", "description": "Patient age if provided" },
      "symptom_duration": { "type": "string", "description": "How long patient has had symptoms" },
      "is_followup": { "type": "boolean", "description": "True if patient said follow-up visit" }
    },
    "required": ["patient_name", "phone", "symptoms", "urgency", "date", "time"]
  }
}
```

**Function 3 — `alert_emergency`**

```json
{
  "name": "alert_emergency",
  "description": "Alert on-call doctor for life-threatening emergencies. Call immediately for chest pain, difficulty breathing, unconscious patient, severe bleeding.",
  "parameters": {
    "type": "object",
    "properties": {
      "patient_name": { "type": "string" },
      "phone": { "type": "string" },
      "symptoms": { "type": "string" },
      "age": { "type": "integer" }
    },
    "required": ["patient_name", "symptoms"]
  }
}
```

### 3) Fill in `.env` files

- `backend/.env`: Supabase + Groq + Vapi + Deepgram keys
- `frontend/.env`: Vapi public key + assistant ID

## Start backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Start ngrok (new terminal)

```bash
ngrok http 8000
```

Copy the **https** URL and set Vapi Assistant **Server URL** to:

- `https://YOUR-NGROK-URL/vapi/webhook`

## Start frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Test checklist

- □ Click “Talk to Aria”
- □ Say “I want to book an appointment”
- □ Complete the conversation
- □ Check Supabase → `appointments` table for new row
- □ Try asking for Sunday → should say clinic is closed
- □ Try interrupting Aria mid-sentence (barge-in test)
- □ Say “chest pain” → should trigger emergency alert

