# Development

## Requirements

- Python 3.11 or newer
- Git
- Any browser

No Node.js, no package manager, no build step for the frontend.

## Running it locally

Two processes, two terminals.

**Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Serves on `http://127.0.0.1:8000`. Docs at `http://127.0.0.1:8000/docs`.

**Frontend**

```bash
python3 -m http.server 5500
```

Open `http://localhost:5500`. Use a server rather than opening `index.html`
directly — `file://` pages cannot make `fetch` requests to the API.

## Updating content

Edit the JSON files in `content/`. No code changes.

| File | Drives |
| --- | --- |
| `profile.json` | Hero, headline numbers, "What I do" cards |
| `experience.json` | Experience timeline |
| `projects.json` | Projects grid |
| `skills.json` | Skills groups |
| `education.json` | Education, certifications, languages |

The backend caches content at startup, so restart `uvicorn` after editing (the
`--reload` flag does this automatically when a file changes).

## Project layout

```
portfolio/
├── index.html            frontend markup
├── style.css             design tokens, layout, responsive rules
├── script.js             menu, theme, scroll spy, API calls
├── cv/                   downloadable CV
├── content/              all portfolio content as JSON
├── backend/
│   ├── main.py           FastAPI application
│   ├── requirements.txt
│   └── portfolio.db      SQLite, created on first run (gitignored)
└── docs/
    ├── architecture.md
    ├── api.md
    └── development.md
```

## Conventions

**CSS** — every color and size comes from a token in `:root`. Add a token rather
than a hard-coded value, so dark mode and future palette changes stay free.

**JavaScript** — the code toggles classes; the CSS decides what those classes
look like. Avoid setting styles inline from JS.

**Python** — content files are the source of truth; `main.py` holds no personal
data. Keep route functions thin and put logic in named functions.

## Reading stored messages

```bash
cd backend
sqlite3 portfolio.db "SELECT created_at, name, email, message FROM messages ORDER BY id DESC;"
```

## Deployment

The frontend deploys from `main` to GitHub Pages. The backend deploys to Render
with build command `pip install -r requirements.txt` and start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

After deploying, set `API_BASE` in `script.js` to the Render URL and add the
GitHub Pages origin to the CORS list in `main.py`.