# Contact and email

The Contact page has no form. It offers direct methods — a `mailto:` link with a
pre-filled subject, plus LinkedIn and GitHub — so a message arrives in a real
inbox with no server involved and nothing to break.

`POST /api/contact` still exists in the backend for the case where a form is
wanted later: it validates with Pydantic, stores to SQLite and can forward by
email. The rest of this page documents that path.

## What happens without configuration

1. The frontend POSTs to `/api/contact`.
2. Pydantic validates the body.
3. The message is written to `backend/portfolio.db`.
4. `send_email` runs as a background task, sees no SMTP settings, and returns.

Nothing fails, and nothing is emailed.

## Reading stored messages

```bash
cd backend
sqlite3 portfolio.db "SELECT created_at, name, email, message FROM messages ORDER BY id DESC;"
```

## Turning on forwarding

Set five environment variables. The backend reads them at request time, so no
code changes are needed.

| Variable | Example | Notes |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` | Your mail provider |
| `SMTP_PORT` | `587` | STARTTLS port |
| `SMTP_USER` | `you@gmail.com` | The sending account |
| `SMTP_PASSWORD` | app password | Never your account password |
| `CONTACT_TO` | `you@gmail.com` | Where messages arrive |

### Gmail

Gmail rejects normal account passwords from applications. You need an
**app password**:

1. Enable two-factor authentication on the Google account.
2. Google Account → Security → App passwords.
3. Generate one for "Mail" and use the 16-character value as `SMTP_PASSWORD`.

### Locally

```bash
cd backend
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=you@gmail.com
export SMTP_PASSWORD=xxxxxxxxxxxxxxxx
export CONTACT_TO=you@gmail.com
uvicorn main:app --reload
```

Never commit these values. `.env` is in `.gitignore` for that reason.

### On Render

Service → **Environment** → add each variable → save. The service redeploys and
picks them up.

## Verifying

`GET /api/health` reports whether email is configured:

```json
{ "status": "ok", "email_configured": true }
```

Then submit the form and check your inbox — and the spam folder the first time.

## Design notes

**Background task.** `send_email` runs after the response is returned, so a slow
mail server never makes the visitor wait, and a delivery failure never turns a
successfully stored message into an error.

**Reply-To.** The mail is sent from your own account with the visitor's address
in `Reply-To`, so hitting reply answers them directly. Sending *as* the visitor
would fail SPF checks and land in spam.

**Storage first, email second.** The message is written to the database before
any mail is attempted, so a mail outage never loses a message.

## Frontend fallback

If the API cannot be reached at all — not deployed, asleep, or offline — the
form does not fail silently. It offers a `mailto:` link pre-filled with the
visitor's name, address and message, so the message still reaches you.
