# Portfolio

Portfolio website built using vanilla JavaScript, Python and FastAPI.

**Live:** https://khadijaa23.github.io/portfolio/
**API:** https://portfolio-api.onrender.com/docs

---

## About

My personal portfolio, built from scratch. The frontend is plain HTML, CSS and
JavaScript with no framework and no build step. The backend is a REST API
written in Python with FastAPI that serves every piece of content on the page
and receives messages from the contact form.

All content lives in `content/*.json`, so updating the site means editing data,
never code.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript (no framework) |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Database | SQLite |
| Hosting | GitHub Pages (frontend), Render (backend) |

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

## Project structure

```
portfolio/
├── index.html              markup
├── style.css               design tokens, layout, responsive rules
├── script.js               menu, theme, scroll spy, API calls
├── cv/                     downloadable CV
├── content/                all portfolio content as JSON
│   ├── profile.json
│   ├── experience.json
│   ├── projects.json
│   ├── skills.json
│   └── education.json
├── backend/
│   ├── main.py             FastAPI application
│   └── requirements.txt
└── docs/
    ├── architecture.md     how it fits together and why
    ├── api.md              endpoint reference
    ├── content.md          content model
    ├── development.md      local setup and conventions
    └── deployment.md       going to production
```

## Documentation

- [Architecture](docs/architecture.md) — structure and the reasoning behind it
- [API reference](docs/api.md) — endpoints, parameters, responses
- [Content model](docs/content.md) — the shape of every JSON file
- [Development](docs/development.md) — running it locally, conventions
- [Deployment](docs/deployment.md) — GitHub Pages and Render

## Features

- Content served from a Python REST API, with static HTML as a fallback if the
  API is unreachable
- Dark mode that follows the system preference and remembers an explicit choice
- Responsive layout with a mobile navigation panel
- Contact form validated by Pydantic and stored in SQLite
- Interactive API documentation generated from the code at `/docs`
- Accessible markup: semantic elements, keyboard focus styles, ARIA state on
  interactive controls

## License

MIT — see [LICENSE](LICENSE). The content in `content/` is personal and not
covered by it.