# Autonomous Voice Agent for Healthcare

## Overview
Autonomous Voice Agent for Healthcare is an AI-powered web application that enables users to interact with a healthcare assistant using voice. The system converts speech to text, processes user queries using an LLM, and responds with voice and text.

## Features
- Voice-based interaction
- Speech-to-Text
- AI-powered healthcare responses
- Text-to-Speech
- User-friendly interface
- FastAPI backend
- React frontend
- MongoDB database

## Tech Stack
- React
- FastAPI
- Python
- MongoDB
- Tailwind CSS
- Groq API

## Project Structure
```
voice-agent/
├── frontend/
├── backend/
└── database/
```

## Installation

### Frontend

```bash
cd voice-agent/frontend
npm install
npm run dev
```

### Backend

```bash
cd voice-agent/backend
pip install -r requirements.txt
python main.py
```

## Note
Environment variables such as API keys are stored in a `.env` file and are **not included** in this repository for security.