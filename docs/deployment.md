# Deployment

The two halves deploy independently: static files to GitHub Pages, the API to
Render. Deploy the backend first, because the frontend needs its URL.

---

## 1. Backend on Render

Render's free tier runs the API without a credit card. Instances sleep after
inactivity and take a few seconds to wake — which is why the frontend keeps
static fallback content.

**Create the service**

1. Sign in at [render.com](https://render.com) with GitHub and authorize the
   `portfolio` repository.
2. **New → Web Service**, select the repository.
3. Configure:

   | Setting | Value |
   | --- | --- |
   | Name | `portfolio-api` |
   | Region | Frankfurt (closest to Tunis) |
   | Root directory | `backend` |
   | Runtime | Python 3 |
   | Build command | `pip install -r requirements.txt` |
   | Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | Instance type | Free |

4. Deploy, then confirm `https://<your-service>.onrender.com/api/health` returns
   `{"status": "ok"}`.

**Why the start command differs from local.** Locally, `uvicorn main:app
--reload` binds to `127.0.0.1`, which only accepts connections from your own
machine. In production the server must bind to `0.0.0.0` to accept outside
traffic, and to the port Render assigns through the `$PORT` environment
variable rather than a port you pick.

**Root directory matters.** Setting it to `backend` makes Render treat that
folder as the project. `main.py` still reaches the content with
`Path(__file__).parent.parent / "content"`, so the repository must be deployed
whole, not just the backend folder.

---

## 2. Update the two URLs

**In `script.js`**, set the production API base:

```javascript
const API_BASE =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://portfolio-api.onrender.com';
```

**In `backend/main.py`**, make sure the GitHub Pages origin is allowed:

```python
allow_origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://khadijaa23.github.io",
]
```

Commit and push both. Render redeploys automatically on every push to `main`.

---

## 3. Frontend on GitHub Pages

1. Repository → **Settings → Pages**.
2. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save, wait a minute or two.

Live at `https://khadijaa23.github.io/portfolio/`, redeployed on every push.

---

## 4. Verify

- [ ] Page loads over HTTPS with no console errors
- [ ] Projects render from the API (network tab shows the `/api/projects` call)
- [ ] Contact form returns a success message, not a CORS error
- [ ] Dark mode persists across a reload
- [ ] Layout is correct on a phone-width screen
- [ ] The CV link downloads the PDF

---

## Troubleshooting

**CORS error in the console.** The frontend origin is missing from
`allow_origins` in `main.py`. It must match exactly, including `https://` and
with no trailing slash.

**Projects show but never update.** The fetch failed and the static fallback is
what you are seeing. Check the network tab; a sleeping Render instance takes a
few seconds on the first request.

**404 on the CV link.** GitHub Pages serves from the repository root, so the
`cv/` folder must be committed. Check that it is not caught by `.gitignore`.

**Messages disappear after a redeploy.** Render's free tier has an ephemeral
filesystem: `portfolio.db` is recreated on each deploy. For persistence, attach
a Render disk or move to a hosted PostgreSQL instance and replace the two
`sqlite3` functions in `main.py`.

---

## Notes on the free tier

| Limitation | Effect | If it matters |
| --- | --- | --- |
| Instance sleeps when idle | First request takes a few seconds | Ping `/api/health` on a schedule |
| Ephemeral filesystem | Stored messages are lost on redeploy | Attach a disk, or use PostgreSQL |
| No custom domain on the free plan | URL stays `*.onrender.com` | Upgrade, or proxy through a domain |
