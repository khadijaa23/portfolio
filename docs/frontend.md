# Frontend

No framework, no build step, no dependencies. Three files.

| File | Contains |
| --- | --- |
| `index.html` | The shell: header, empty `<main id="app">`, footer |
| `style.css` | Design tokens, components, responsive rules |
| `script.js` | Data layer, views, router, theme and menu |

## Routes

| URL | View | Notes |
| --- | --- | --- |
| `#/` | `HomeView` | Hero, headline numbers, areas of expertise |
| `#/experience` | `ExperienceView` | Timeline with the stack for each role |
| `#/projects` | `ProjectsView` | Project cards, each one a link |
| `#/projects/:slug` | `ProjectDetailView` | One project, uses the route parameter |
| `#/background` | `BackgroundView` | Skills, education, certifications, languages |
| `#/contact` | `ContactView` | The only page that needs the API |
| anything else | `NotFoundView` | 404 |

## Adding a page

1. Write a view object:

```javascript
const WritingView = {
  title: 'Writing — Khadija Elamri',
  async render() {
    const posts = await getContent('writing');
    return `<div class="container page">${pageHeader('Writing', 'Notes', '')}</div>`;
  },
};
```

2. Register the route:

```javascript
{ path: '/writing', view: WritingView },
```

3. Add the nav link in `index.html`:

```html
<li><a href="#/writing">Writing</a></li>
```

The active-link highlighting, page transition, title update and scroll reveal
all apply automatically.

## Design system

Every color, size and spacing value is a custom property defined in `:root` and
overridden under `html[data-theme="dark"]`. Add a token rather than a literal
value, so dark mode and future palette changes stay free.

| Token group | Examples |
| --- | --- |
| Color | `--paper`, `--ink`, `--violet`, `--lilac`, `--line` |
| Gradient | `--gradient`, `--gradient-text`, `--glow` |
| Type | `--font-display`, `--font-body`, `--font-mono`, `--text-*` |
| Space | `--space-1` … `--space-24` |
| Shape | `--radius`, `--radius-lg`, `--max-width` |

**The monospace rule.** Anything that is data — dates, headline numbers, tech
tags, labels — is set in the mono face. Anything that is prose is set in the
body face. This is the site's visual signature and it encodes something true
about the content rather than decorating it.

**The aurora.** Two blurred violet ellipses drift behind the hero, drawn with
`::before` and `::after` on `.hero` at `z-index: -1`. It is the one bold element
on the page; everything around it stays restrained.

## Conventions

- JavaScript toggles classes; CSS decides what those classes look like. Avoid
  setting styles inline from JS.
- Every value interpolated into HTML goes through `esc()` first. Skipping it is
  a cross-site scripting hole.
- Event listeners for a view go in its `mount()`, never in `render()` — the
  elements do not exist until the HTML is in the document.
- New sections are picked up by scroll reveal automatically if they use an
  existing component class; otherwise add the selector in `revealOnScroll()`.

## Accessibility floor

- Semantic elements, one `<h1>` per page
- Visible keyboard focus everywhere (`:focus-visible`)
- `aria-expanded` kept in sync on the menu button
- `aria-live="polite"` on `<main>` so route changes are announced
- All motion disabled under `prefers-reduced-motion: reduce`
