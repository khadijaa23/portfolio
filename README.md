# Portfolio

Portfolio website built using vanilla JavaScript, Python and FastAPI.

**Live:** https://khadijaa23.github.io/portfolio/

---

## About

My personal portfolio, built from scratch. The frontend is a single-page
application written in plain JavaScript — no framework, no build step, and a
hand-written client-side router. The backend is a REST API in Python with
FastAPI that serves every piece of content on the site and receives messages
from the contact form.

All content lives in `content/*.json`, so updating the portfolio means editing
data, never code.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript (no framework, no build) |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Database | SQLite |
| Hosting | GitHub Pages (frontend), Render (backend) |

## Features

- Bilingual (English and French) with a language toggle, browser-language
  detection and a remembered choice
- Hand-written hash router with parameterised routes (`#/projects/:slug`)
- Animated page transitions using the View Transitions API
- Content served from a Python REST API, with the same JSON files as a static
  fallback so the site works when the backend is asleep
- Dark mode following the system preference, with an explicit choice remembered
- Contact page with direct methods: a pre-filled `mailto:` link, LinkedIn and
  GitHub — no form to fail, no server needed to reach me
- Interactive API documentation generated from the code at `/docs`
- Responsive down to mobile, visible keyboard focus, motion disabled under
  `prefers-reduced-motion`

## Quick start

```bash
git clone https://github.com/khadijaa23/portfolio.git
cd portfolio

# Backend — terminal 1
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload         # http://127.0.0.1:8000/docs

# Frontend — terminal 2, from the project root
python3 -m http.server 5500       # http://localhost:5500
```

The frontend runs without the backend: it falls back to the JSON files in
`content/`. Only the contact form needs the API.

## Project structure

```
portfolio/
├── index.html              app shell
├── style.css               design tokens, components, responsive rules
├── script.js               data layer, views, router, theme, menu
├── cv/                     downloadable CV
├── content/                all portfolio content as JSON
│   ├── en/                 profile, experience, projects, skills, education
│   └── fr/                 the same five files, translated
├── backend/
│   ├── main.py             FastAPI application
│   └── requirements.txt
└── docs/
    ├── architecture.md     how it fits together and why
    ├── frontend.md         routes, design system, conventions
    ├── api.md              endpoint reference
    ├── content.md          content model
    ├── email.md            contact form storage and forwarding
    ├── development.md      local setup and conventions
    └── deployment.md       going to production
```

## Documentation

- [Architecture](docs/architecture.md) — structure, decisions, known limitations
- [Frontend](docs/frontend.md) — routes, design system, how to add a page
- [API reference](docs/api.md) — endpoints, parameters, responses
- [Content model](docs/content.md) — the shape of every JSON file
- [Email](docs/email.md) — how contact messages are stored and forwarded
- [Development](docs/development.md) — running it locally
- [Deployment](docs/deployment.md) — GitHub Pages and Render

## License

MIT — see [LICENSE](LICENSE). The content in `content/` is personal and not
covered by it.
