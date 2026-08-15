"""
Portfolio backend — FastAPI

Content lives in ../content/<lang>/*.json. This file contains no personal data:
to update the portfolio you edit the content files, never the code.

Endpoints
    GET  /api/profile?lang=en     profile, highlights, expertise
    GET  /api/experience?lang=en  work history
    GET  /api/projects?lang=en    projects
    GET  /api/projects/{slug}     one project
    GET  /api/skills?lang=en      skill groups
    GET  /api/education?lang=en   education, certifications, languages
    POST /api/contact             store a message, and email it if SMTP is set
    GET  /api/health              liveness check

Run locally
    uvicorn main:app --reload
Docs
    http://127.0.0.1:8000/docs

Email forwarding (optional)
    Set these environment variables and messages are also sent to your inbox.
    Without them the message is still stored; nothing fails.

    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=you@gmail.com
    SMTP_PASSWORD=<a Gmail app password, not your account password>
    CONTACT_TO=you@gmail.com
"""

import json
import os
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.message import EmailMessage
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parent
CONTENT_DIR = BASE_DIR.parent / "content"
DB_PATH = BASE_DIR / "portfolio.db"

Language = Literal["en", "fr"]

app = FastAPI(
    title="Portfolio API",
    description="Backend for khadijaa23's portfolio. Bilingual content served from JSON files.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "https://khadijaa23.github.io",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Content loading
# --------------------------------------------------------------------------
@lru_cache(maxsize=None)
def load_content(name: str, lang: str) -> Any:
    """
    Read content/<lang>/<name>.json, falling back to English if a translation
    is missing. lru_cache keeps each file in memory after the first read.
    """
    for candidate in (CONTENT_DIR / lang / f"{name}.json", CONTENT_DIR / "en" / f"{name}.json"):
        if candidate.is_file():
            with candidate.open(encoding="utf-8") as file:
                return json.load(file)

    raise HTTPException(status_code=500, detail=f"Missing content file: {name}.json")


# --------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------
class ContactMessage(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=2000)


# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------
def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT NOT NULL,
                email      TEXT NOT NULL,
                message    TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def save_message(payload: ContactMessage) -> int:
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            # ? placeholders are what prevent SQL injection.
            "INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
            (payload.name, payload.email, payload.message,
             datetime.now(timezone.utc).isoformat()),
        )
        return cursor.lastrowid


# --------------------------------------------------------------------------
# Email
# --------------------------------------------------------------------------
def send_email(payload: ContactMessage) -> None:
    """
    Forward a message by email. Runs as a background task so the visitor never
    waits on the mail server, and a failure here does not turn a saved message
    into an error response.
    """
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    recipient = os.getenv("CONTACT_TO", user)

    if not all([host, user, password, recipient]):
        return          # email not configured; the message is still stored

    message = EmailMessage()
    message["Subject"] = f"Portfolio message from {payload.name}"
    message["From"] = user
    message["To"] = recipient
    message["Reply-To"] = payload.email       # replying goes straight to them
    message.set_content(f"From: {payload.name} <{payload.email}>\n\n{payload.message}")

    try:
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=15) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(message)
    except Exception as error:                # noqa: BLE001 - never break the request
        print(f"Email delivery failed: {error}")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# --------------------------------------------------------------------------
# Content routes
# --------------------------------------------------------------------------
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "email_configured": bool(os.getenv("SMTP_HOST"))}


@app.get("/api/profile")
def get_profile(lang: Language = Query("en")) -> Any:
    return load_content("profile", lang)


@app.get("/api/experience")
def get_experience(lang: Language = Query("en")) -> Any:
    return load_content("experience", lang)


@app.get("/api/projects")
def get_projects(lang: Language = Query("en"), featured_only: bool = False) -> Any:
    projects = load_content("projects", lang)
    if featured_only:
        return [p for p in projects if p.get("featured")]
    return projects


@app.get("/api/projects/{slug}")
def get_project(slug: str, lang: Language = Query("en")) -> Any:
    for project in load_content("projects", lang):
        if project["slug"] == slug:
            return project
    raise HTTPException(status_code=404, detail="Project not found")


@app.get("/api/skills")
def get_skills(lang: Language = Query("en")) -> Any:
    return load_content("skills", lang)


@app.get("/api/education")
def get_education(lang: Language = Query("en")) -> Any:
    return load_content("education", lang)


# --------------------------------------------------------------------------
# Contact route
# --------------------------------------------------------------------------
@app.post("/api/contact", status_code=201)
def create_message(payload: ContactMessage, background: BackgroundTasks) -> dict:
    """
    Store a contact message and forward it by email if SMTP is configured.

    Validation happens before this function runs: a malformed body gets a 422
    from Pydantic, so there is no checking code here.
    """
    try:
        message_id = save_message(payload)
    except sqlite3.Error:
        raise HTTPException(status_code=500, detail="Could not save the message")

    background.add_task(send_email, payload)
    return {"id": message_id, "detail": "Message received"}
