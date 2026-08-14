# Architecture

## Overview

The site is split in two halves that can be deployed and scaled separately.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Frontend (static)          │        │  Backend (FastAPI)           │
│  GitHub Pages               │  HTTPS │  Render                      │
│                             │ ─────► │                              │
│  index.html                 │  JSON  │  GET  /api/profile           │
│  style.css                  │ ◄───── │  GET  /api/experience        │
│  script.js                  │        │  GET  /api/projects          │
│                             │        │  GET  /api/skills            │
│  No framework, no build step │        │  GET  /api/education         │
└─────────────────────────────┘        │  POST /api/contact           │
                                       └──────────┬───────────────────┘
                                                  │
                                    ┌─────────────┴──────────────┐
                                    │                            │
                              content/*.json              portfolio.db
                              (read at startup)           (SQLite, messages)
```

## Decisions and why

**No frontend framework.** The site is a handful of static sections with light
interactivity. React would add a build step, a dependency tree and a bundle to
solve problems this page does not have. Vanilla HTML, CSS and JavaScript keeps
it fast to load and trivial to host.

**Content lives in JSON, not in code.** Everything personal — profile, roles,
projects, skills, education — sits in `content/*.json`. Updating the portfolio
means editing data, never touching `main.py` or the markup. This also means the
same content can feed the API and, later, a PDF CV generator or a second theme
without duplication.

**FastAPI over Flask.** Validation, serialization and OpenAPI documentation come
from type hints via Pydantic, so there is no hand-written request checking. The
generated docs at `/docs` are a genuine feature, not a nicety.

**SQLite for messages.** One file, no server, no connection pooling, no ops
burden. A contact form receives a handful of messages a week; anything more
would be over-engineering. Swapping to PostgreSQL later means changing the
`save_message` function only.

**Progressive enhancement.** The projects section is rendered as static HTML in
`index.html` and replaced by the API version once the fetch succeeds. If the
backend is asleep, unreachable or JavaScript fails, the visitor still sees the
projects. Free hosting tiers sleep; the page should not depend on them.

**Theming through CSS custom properties.** Every color is a token in `:root`,
overridden under `html[data-theme="dark"]`. The JavaScript toggle sets one
attribute; nothing else in the CSS knows dark mode exists.

## Known limitations

- Content is cached at process start (`lru_cache`), so editing a JSON file
  requires a restart. Fine with `--reload` locally and with a redeploy in
  production.
- No rate limiting on `POST /api/contact`. A public form should have it before
  it attracts spam.
- Messages are stored but not forwarded by email; they are read from the
  database or a future admin endpoint.