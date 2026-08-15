# API reference

Base URL, local: `http://127.0.0.1:8000`

Every endpoint is read-only and takes an optional `?lang=` parameter (`en` or
`fr`, default `en`), falling back to English when a translation is missing.
Interactive docs: `/docs` (Swagger UI) and `/redoc`, both generated from the code.


---

## GET /api/health

Liveness check. Used by the deployment platform and to wake a sleeping instance.

```json
{ "status": "ok" }
```

---

## GET /api/profile

Name, title, tagline, links, headline numbers and the three areas of expertise.

```json
{
  "name": "Khadija Elamri",
  "title": "Full-Stack Developer — Python & JavaScript",
  "available": true,
  "highlights": [{ "value": "3+", "label": "Years shipping production software" }],
  "expertise": [{ "title": "Python & Backend", "description": "…" }]
}
```

---

## GET /api/experience

Work history, most recent first. `end` is `null` for the current role.

```json
[
  {
    "slug": "craftschoolship-saas",
    "role": "Full-Stack Developer (SaaS) & DevOps",
    "company": "CraftSchoolship",
    "period": "Sep 2024 — Present",
    "current": true,
    "highlights": ["…"],
    "stack": ["React 19", "TypeScript"]
  }
]
```

---

## GET /api/projects

| Query parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `featured_only` | boolean | `false` | Return only projects marked featured |

```json
[
  {
    "slug": "portfolio",
    "title": "This portfolio",
    "kind": "Personal project",
    "tags": ["Python", "FastAPI"],
    "repo_url": "https://github.com/khadijaa23/portfolio"
  }
]
```

## GET /api/projects/{slug}

One project. Returns `404` with `{"detail": "Project not found"}` if the slug is
unknown.

---

## GET /api/skills

Skill groups in display order.

```json
[{ "group": "Languages", "items": ["Python", "TypeScript"] }]
```

---

## GET /api/education

Degrees, certifications and spoken languages.

---

## CORS

Allowed origins are listed in `main.py`. Add any new frontend origin there or
the browser will block the request before it reaches the server.
