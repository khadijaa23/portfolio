"""
Portfolio backend — FastAPI

A read-only content API. Everything the site displays lives in
../content/<lang>/*.json; this file contains no personal data, so updating
the portfolio means editing content, never code.

Endpoints
    GET /api/health              liveness check
    GET /api/profile?lang=en     name, title, badge, links, highlights
    GET /api/experience?lang=en  work history
    GET /api/projects?lang=en    projects
    GET /api/projects/{slug}     one project
    GET /api/skills?lang=en      skill groups
    GET /api/education?lang=en   education, certifications, languages

Run locally
    uvicorn main:app --reload
Docs
    http://127.0.0.1:8000/docs
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
CONTENT_DIR = BASE_DIR.parent / "content"

Language = Literal["en", "fr"]

app = FastAPI(
    title="Portfolio API",
    description="Read-only bilingual content API for khadijaa23's portfolio.",
    version="2.0.0",
)

# Browsers block a page on one origin from calling an API on another origin
# unless the API allows it. The frontend and backend are on different hosts.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "https://khadijaa23.github.io",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@lru_cache(maxsize=None)
def load_content(name: str, lang: str) -> Any:
    """
    Read content/<lang>/<name>.json, falling back to English when a
    translation is missing. lru_cache keeps each file in memory after the
    first read, since content does not change while the server runs.
    """
    for candidate in (CONTENT_DIR / lang / f"{name}.json",
                      CONTENT_DIR / "en" / f"{name}.json"):
        if candidate.is_file():
            with candidate.open(encoding="utf-8") as file:
                return json.load(file)

    raise HTTPException(status_code=500, detail=f"Missing content file: {name}.json")


@app.get("/api/health")
def health() -> dict:
    """Liveness check, used by the host and to wake a sleeping instance."""
    return {"status": "ok"}


@app.get("/api/profile")
def get_profile(lang: Language = Query("en")) -> Any:
    return load_content("profile", lang)


@app.get("/api/experience")
def get_experience(lang: Language = Query("en")) -> Any:
    return load_content("experience", lang)


@app.get("/api/projects")
def get_projects(lang: Language = Query("en"), featured_only: bool = False) -> Any:
    """
    Return the projects. Pass ?featured_only=true for featured ones only —
    FastAPI turns that type hint into a documented, validated query parameter.
    """
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
