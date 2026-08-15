# Content model

Every piece of text on the site comes from a JSON file under `content/`. The
backend reads these files and serves them; the frontend renders whatever it
receives. Nothing personal is written in `main.py`, `index.html` or `script.js`.

## Languages

The site is bilingual. Content is duplicated per locale:

```
content/
├── en/     profile, experience, projects, skills, education
└── fr/     the same five files, translated
```

The API takes a `?lang=` parameter (`en` or `fr`) and falls back to English if a
translation is missing, so adding a language never breaks the site mid-way.
Interface labels — navigation, buttons, form fields, page titles — are not in
these files; they live in the `STRINGS` object in `script.js`.

Keep the two locales structurally identical: same keys, same slugs, same order.
Only the human-readable values differ.

To update the portfolio, edit a file and restart the backend.

---

## profile.json

An object. Drives the hero, the headline numbers and the "What I do" cards.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Shown in the hero and the nav |
| `title` | string | Job title line under the name |
| `badge` | string | Small pill above the name; omit the field to hide it |
| `tagline` | string | One or two sentences, the elevator pitch |
| `links` | object | `email`, `github`, `linkedin`, `cv` |
| `highlights` | array | Headline numbers: `value` and `label` |
| `expertise` | array | Cards: `title` and `description` |

Keep `highlights` to three entries — the layout is a three-column grid, and the
whole point of the strip is that it can be read in one glance.

---

## experience.json

An array, most recent role first.

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | Unique identifier, lowercase and hyphenated |
| `role` | string | Job title |
| `company` | string | Employer |
| `start` | string | `YYYY-MM`, machine-readable |
| `end` | string or null | `null` means current |
| `period` | string | Human-readable, e.g. `Sep 2024 — Present` |
| `current` | boolean | Convenience flag for styling |
| `summary` | string | One line read before the bullets; keep it skimmable |
| `highlights` | array of strings | Bullets, each one achievement |
| `stack` | array of strings | Technologies used in that role |

Both `start`/`end` and `period` exist on purpose: the first is for sorting and
future date logic, the second is what gets displayed.

---

## projects.json

An array.

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | Used by `GET /api/projects/{slug}` |
| `title` | string | Project name |
| `kind` | string | Context label, e.g. `Personal project` |
| `featured` | boolean | Filtered by `?featured_only=true` |
| `description` | string | Two or three sentences |
| `role` | string | What you personally did |
| `tags` | array of strings | Technologies, shown as chips |
| `diagram` | string or null | Path to an SVG shown above the detail columns |
| `diagram_caption` | string or null | One line under the diagram |
| `repo_url` | string or null | `null` hides the link |
| `live_url` | string or null | `null` hides the link |

Client work has `repo_url: null` because the code is not public. Saying so
explicitly is better than an empty link.

---

## skills.json

An array of groups, rendered in the order given.

```json
[{ "group": "Languages", "items": ["Python", "TypeScript"] }]
```

Group order is a positioning decision, not a detail. Whichever stack you are
applying for should come first — the reader stops scanning early.

---

## education.json

An object with three arrays.

| Key | Fields |
| --- | --- |
| `education` | `degree`, `school`, `year`, `location` |
| `certifications` | `name`, `issuer`, `year` (`null` if unknown) |
| `languages` | `language`, `level` |

---

## Conventions

- Dates that are displayed go in `period` or `year`; dates that are computed on
  go in `start` and `end` as `YYYY-MM`.
- Use `null`, never an empty string, for a value that does not exist. The
  frontend checks for `null` to decide whether to render an element at all.
- Slugs are unique, lowercase, hyphenated, and should not change once published,
  since they can appear in URLs.
- Write descriptions in plain sentences. They are rendered as text and any HTML
  in them is escaped, so tags will show up literally.
