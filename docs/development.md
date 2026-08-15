# Development

## Requirements

- Python 3.11 or newer
- Git
- A browser

No Node.js, no package manager, no build step.

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

Serves on `http://127.0.0.1:8000`, docs at `/docs`.

**Frontend**

```bash
python3 -m http.server 5500
```

Open `http://localhost:5500`. Use a server rather than opening `index.html`
directly: `file://` pages cannot make `fetch` requests.

The frontend works without the backend — it falls back to the JSON files in
`content/`. Only the contact form needs the API running.

## Updating content

Edit the JSON files in `content/`. No code changes.

| File | Drives |
| --- | --- |
| `profile.json` | Home page: hero, headline numbers, expertise cards |
| `experience.json` | Experience timeline |
| `projects.json` | Projects list and each project detail page |
| `skills.json` | Skills groups on the Background page |
| `education.json` | Education, certifications, languages |

The backend caches content at startup, so restart `uvicorn` after editing —
`--reload` does this automatically.

See [content.md](content.md) for the shape of each file.

## Project layout

```
portfolio/
├── index.html            app shell
├── style.css             design tokens, components, responsive rules
├── script.js             data layer, views, router, theme, menu
├── cv/                   downloadable CV
├── content/              all portfolio content as JSON
├── backend/
│   ├── main.py           FastAPI application
│   ├── requirements.txt
│   └── portfolio.db      SQLite, created on first run (gitignored)
└── docs/
```

## Conventions

**CSS** — every color and size comes from a token in `:root`. Add a token rather
than a hard-coded value, so dark mode stays free.

**JavaScript** — the code toggles classes; the CSS decides what those classes
look like. Everything interpolated into HTML goes through `esc()`.

**Python** — content files are the source of truth. `main.py` holds no personal
data. Keep route functions thin.

See [frontend.md](frontend.md) for how to add a page.

## Reading stored messages

```bash
cd backend
sqlite3 portfolio.db "SELECT created_at, name, email, message FROM messages ORDER BY id DESC;"
```

## Committing

Small commits with clear messages, one per unit of work:

```bash
git add .
git commit -m "Add writing page and route"
git push
```
