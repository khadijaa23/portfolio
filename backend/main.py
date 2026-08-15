"""
Portfolio backend — FastAPI

All content lives in ../content/*.json. This file contains no personal data:
to update the portfolio you edit the content files, never the code.

Endpoints
    GET  /api/profile     profile, highlights, expertise
    GET  /api/experience  work history
    GET  /api/projects    projects
    GET  /api/skills      skill groups
    GET  /api/education   education, certifications, languages
    POST /api/contact     store a contact message
    GET  /api/health      liveness check

Run locally
    uvicorn main:app --reload
Docs
    http://127.0.0.1:8000/docs
"""

import json
import sqlite3
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parent
CONTENT_DIR = BASE_DIR.parent / "content"
DB_PATH = BASE_DIR / "portfolio.db"

app = FastAPI(
    title="Portfolio API",
    description="Backend for khadijaa23's portfolio. Content is served from JSON files.",
    version="1.0.0",
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
def load_content(name: str) -> Any:
    """
    Read content/<name>.json.

    lru_cache means the file is read from disk once and kept in memory —
    the content does not change while the server runs.
    """
    path = CONTENT_DIR / f"{name}.json"
    if not path.is_file():
        raise HTTPException(status_code=500, detail=f"Missing content file: {name}.json")

    with path.open(encoding="utf-8") as file:
        return json.load(file)


# --------------------------------------------------------------------------
# Models
# Pydantic validates the incoming request body and documents the API.
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
            (
                payload.name,
                payload.email,
                payload.message,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        return cursor.lastrowid


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# --------------------------------------------------------------------------
# Content routes
# --------------------------------------------------------------------------
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/profile")
def get_profile() -> Any:
    return load_content("profile")


@app.get("/api/experience")
def get_experience() -> Any:
    return load_content("experience")


@app.get("/api/projects")
def get_projects(featured_only: bool = False) -> Any:
    """
    Return the projects. Pass ?featured_only=true to get only featured ones —
    FastAPI turns that type hint into a documented, validated query parameter.
    """
    projects = load_content("projects")
    if featured_only:
        return [p for p in projects if p.get("featured")]
    return projects


@app.get("/api/projects/{slug}")
def get_project(slug: str) -> Any:
    for project in load_content("projects"):
        if project["slug"] == slug:
            return project
    raise HTTPException(status_code=404, detail="Project not found")


@app.get("/api/skills")
def get_skills() -> Any:
    return load_content("skills")


@app.get("/api/education")
def get_education() -> Any:
    return load_content("education")


# --------------------------------------------------------------------------
# Contact route
# --------------------------------------------------------------------------
@app.post("/api/contact", status_code=201)
def create_message(payload: ContactMessage) -> dict:
    """
    Store a contact message.

    If the body is malformed FastAPI returns 422 before this function runs,
    so there is no validation code here.
    """
    try:
        message_id = save_message(payload)
    except sqlite3.Error:
        raise HTTPException(status_code=500, detail="Could not save the message")

    return {"id": message_id, "detail": "Message received"}
