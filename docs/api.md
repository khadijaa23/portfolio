# API reference

Base URL, local: `http://127.0.0.1:8000`
Interactive docs: `/docs` (Swagger UI) and `/redoc`, both generated from the code.

All content endpoints are read-only and require no authentication.

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

## POST /api/contact

Store a message from the contact form.

**Request**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Hello, we have an opening that might interest you."
}
```

**Validation**

| Field | Rule |
| --- | --- |
| `name` | 2–100 characters |
| `email` | must be a valid address |
| `message` | 10–2000 characters |

**Responses**

| Status | Body |
| --- | --- |
| `201` | `{ "id": 4, "detail": "Message received" }` |
| `422` | Pydantic validation error naming the offending field |
| `500` | `{ "detail": "Could not save the message" }` |

A `422` body looks like this, which is what the frontend reads to show a
field-specific error:

```json
{
  "detail": [
    { "loc": ["body", "email"], "msg": "value is not a valid email address" }
  ]
}
```

---

## CORS

Allowed origins are listed in `main.py`. Add any new frontend origin there or
the browser will block the request before it reaches the server.