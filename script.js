/* ==========================================================================
   PORTFOLIO — script.js

   A small single-page application, written by hand with no framework.

   1. Data layer   — fetches content, API first with a local fallback
   2. Helpers      — escaping and small HTML builders
   3. Views        — one function per page, each returning an HTML string
   4. Router       — maps the URL hash to a view
   5. Chrome       — theme toggle and mobile menu (shared by every page)
   ========================================================================== */

'use strict';


/* ==========================================================================
   1. DATA LAYER
   ========================================================================== */

const API_BASE =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://YOUR-BACKEND-URL.onrender.com';   // set after deploying

// Content already fetched, kept in memory so moving between pages is instant.
const cache = new Map();

/**
 * Load a content file.
 *
 * Tries the FastAPI backend first. If it is unreachable — asleep on a free
 * tier, or simply not running locally — falls back to the same JSON files
 * served as static assets. One source of truth, two ways to reach it.
 */
async function getContent(name) {
  if (cache.has(name)) return cache.get(name);

  const sources = [`${API_BASE}/api/${name}`, `content/${name}.json`];

  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      cache.set(name, data);
      return data;
    } catch (error) {
      // Try the next source.
    }
  }

  throw new Error(`Could not load ${name}`);
}


/* ==========================================================================
   2. HELPERS
   ========================================================================== */

// Content is inserted with innerHTML, so every value must be escaped first.
// Without this, any markup in the data would be executed by the browser.
function esc(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function tagList(items) {
  if (!items || !items.length) return '';
  return `<ul class="tags">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

function pageHeader(eyebrow, title, intro) {
  return `
    <header class="page-head">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(title)}</h1>
      ${intro ? `<p class="page-intro">${esc(intro)}</p>` : ''}
    </header>
  `;
}


/* ==========================================================================
   3. VIEWS
   Each view is an object with a title, a render() that returns HTML, and
   optionally a mount() that runs after the HTML is on the page — that is
   where event listeners go, since the elements do not exist before then.
   ========================================================================== */

const HomeView = {
  title: 'Khadija Elamri — Full-Stack Developer',

  async render() {
    const profile = await getContent('profile');

    const highlights = profile.highlights
      .map(
        (item) => `
          <div class="stat">
            <span class="stat-number">${esc(item.value)}</span>
            <span class="stat-label">${esc(item.label)}</span>
          </div>`
      )
      .join('');

    const expertise = profile.expertise
      .map(
        (item) => `
          <article class="card">
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
          </article>`
      )
      .join('');

    return `
      <section class="hero container">
        ${profile.available ? '<p class="hero-badge">Available for work</p>' : ''}
        <h1>${esc(profile.name)}</h1>
        <p class="hero-title">${esc(profile.title)}</p>
        <p class="hero-tagline">${esc(profile.tagline)}</p>

        <div class="hero-actions">
          <a href="#/projects" class="btn btn-primary">See my work</a>
          <a href="${esc(profile.links.cv)}" class="btn btn-secondary" download>Download CV</a>
        </div>

        <ul class="hero-links">
          <li><a href="${esc(profile.links.github)}">GitHub</a></li>
          <li><a href="${esc(profile.links.linkedin)}">LinkedIn</a></li>
          <li><a href="mailto:${esc(profile.links.email)}">Email</a></li>
        </ul>
      </section>

      <section class="stats container">${highlights}</section>

      <section class="section container">
        <h2>What I do</h2>
        <div class="cards">${expertise}</div>
      </section>

      <section class="section container cta">
        <h2>Let's talk</h2>
        <p class="section-intro">Open to full-stack and DevOps roles, in Tunis or remote.</p>
        <a href="#/contact" class="btn btn-primary">Get in touch</a>
      </section>
    `;
  },
};


const ExperienceView = {
  title: 'Experience — Khadija Elamri',

  async render() {
    const roles = await getContent('experience');

    const items = roles
      .map(
        (role) => `
          <li class="timeline-item">
            <p class="timeline-date">${esc(role.period)}</p>
            <h3>${esc(role.role)}</h3>
            <p class="timeline-company">${esc(role.company)} · ${esc(role.location)}</p>
            <ul>${role.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
            ${tagList(role.stack)}
          </li>`
      )
      .join('');

    return `
      <div class="container page">
        ${pageHeader('Experience', 'Where I have worked', 'Three years building and running ERP and SaaS platforms.')}
        <ol class="timeline">${items}</ol>
      </div>
    `;
  },
};


const ProjectsView = {
  title: 'Projects — Khadija Elamri',

  async render() {
    const projects = await getContent('projects');

    const cards = projects
      .map(
        (project) => `
          <a class="project-card" href="#/projects/${esc(project.slug)}">
            <h3>${esc(project.title)}</h3>
            <p class="project-type">${esc(project.kind)}</p>
            <p>${esc(project.description)}</p>
            ${tagList(project.tags)}
            <p class="project-links"><span>Read more</span></p>
          </a>`
      )
      .join('');

    return `
      <div class="container page">
        ${pageHeader('Projects', 'What I have built', 'Production systems at work, and this site.')}
        <div class="projects-grid">${cards}</div>
      </div>
    `;
  },
};


const ProjectDetailView = {
  title: 'Project — Khadija Elamri',

  async render(params) {
    const projects = await getContent('projects');
    const project = projects.find((p) => p.slug === params.slug);

    if (!project) return NotFoundView.render();

    this.title = `${project.title} — Khadija Elamri`;

    const links = [
      project.repo_url ? `<a class="btn btn-secondary" href="${esc(project.repo_url)}">Source code</a>` : '',
      project.live_url ? `<a class="btn btn-primary" href="${esc(project.live_url)}">Visit site</a>` : '',
    ].join('');

    return `
      <div class="container page">
        <a class="back-link" href="#/projects">Back to projects</a>

        ${pageHeader(project.kind, project.title, project.description)}

        <div class="detail-grid">
          <section>
            <h2>My role</h2>
            <p>${esc(project.role || 'Development across the project.')}</p>
          </section>

          <section>
            <h2>Stack</h2>
            ${tagList(project.tags)}
          </section>
        </div>

        ${links ? `<div class="hero-actions">${links}</div>`
                : '<p class="note">This is client work, so the source is not public.</p>'}
      </div>
    `;
  },
};


const BackgroundView = {
  title: 'Background — Khadija Elamri',

  async render() {
    // Promise.all runs both requests at the same time instead of waiting
    // for the first to finish before starting the second.
    const [skills, background] = await Promise.all([
      getContent('skills'),
      getContent('education'),
    ]);

    const skillGroups = skills
      .map(
        (group) => `
          <div class="skill-group">
            <h3>${esc(group.group)}</h3>
            ${tagList(group.items)}
          </div>`
      )
      .join('');

    const education = background.education
      .map(
        (item) => `
          <li>
            <strong>${esc(item.degree)}</strong>
            <span>${esc([item.school, item.year].filter(Boolean).join(' · '))}</span>
          </li>`
      )
      .join('');

    const certifications = background.certifications
      .map(
        (item) => `
          <li>
            <strong>${esc(item.name)}</strong>
            <span>${esc([item.issuer, item.year].filter(Boolean).join(' · '))}</span>
          </li>`
      )
      .join('');

    const languages = background.languages
      .map((item) => `<li>${esc(item.language)} — ${esc(item.level)}</li>`)
      .join('');

    return `
      <div class="container page">
        ${pageHeader('Background', 'Skills and education', 'What I work with, and where I learned it.')}

        <section class="section-block">
          <h2>Skills</h2>
          <div class="skills-groups">${skillGroups}</div>
        </section>

        <section class="section-block">
          <div class="two-col">
            <div>
              <h2>Education</h2>
              <ul class="plain-list">${education}</ul>
            </div>
            <div>
              <h2>Certifications</h2>
              <ul class="plain-list">${certifications}</ul>
            </div>
          </div>
        </section>

        <section class="section-block">
          <h2>Languages</h2>
          <ul class="tags">${languages}</ul>
        </section>
      </div>
    `;
  },
};


const ContactView = {
  title: 'Contact — Khadija Elamri',

  async render() {
    const profile = await getContent('profile');

    return `
      <div class="container page">
        ${pageHeader('Contact', "Let's talk", 'Open to full-stack and DevOps roles, in Tunis or remote.')}

        <form class="contact-form" id="contact-form">
          <div class="field">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="field">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="5" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Send message</button>
          <p class="form-status" id="form-status"></p>
        </form>

        <p class="note">
          Or email me directly at
          <a href="mailto:${esc(profile.links.email)}">${esc(profile.links.email)}</a>.
        </p>
      </div>
    `;
  },

  // Runs after the HTML is in the document, so the form element exists.
  mount() {
    const form = document.querySelector('#contact-form');
    const status = document.querySelector('#form-status');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();                                  // no page reload

      const data = Object.fromEntries(new FormData(form));
      button.disabled = true;
      status.textContent = 'Sending…';
      status.className = 'form-status';

      try {
        const response = await fetch(`${API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.status === 422) {
          const problem = await response.json();
          const first = problem.detail?.[0];
          throw new Error(first ? `${first.loc.at(-1)}: ${first.msg}` : 'Check your details');
        }

        if (!response.ok) throw new Error('The server could not save the message');

        form.reset();
        status.textContent = 'Message sent. I will reply soon.';
        status.className = 'form-status is-success';
      } catch (error) {
        status.textContent = `${error.message}. You can also email amrikadija23@gmail.com`;
        status.className = 'form-status is-error';
      } finally {
        button.disabled = false;
      }
    });
  },
};


const NotFoundView = {
  title: 'Not found — Khadija Elamri',
  async render() {
    return `
      <div class="container page">
        ${pageHeader('404', 'This page does not exist', 'The link may be out of date.')}
        <a href="#/" class="btn btn-primary">Back to home</a>
      </div>
    `;
  },
};


/* ==========================================================================
   4. ROUTER
   ========================================================================== */

const routes = [
  { path: '/',                view: HomeView },
  { path: '/experience',      view: ExperienceView },
  { path: '/projects',        view: ProjectsView },
  { path: '/projects/:slug',  view: ProjectDetailView },
  { path: '/background',      view: BackgroundView },
  { path: '/contact',         view: ContactView },
];

/**
 * Turn '/projects/:slug' into a regular expression that also captures
 * the value, so '/projects/eduerp' yields { slug: 'eduerp' }.
 */
function matchRoute(pathname) {
  for (const route of routes) {
    const names = [];
    const pattern = route.path.replace(/:([^/]+)/g, function (_, name) {
      names.push(name);
      return '([^/]+)';
    });

    const match = pathname.match(new RegExp(`^${pattern}$`));
    if (!match) continue;

    const params = {};
    names.forEach(function (name, index) {
      params[name] = decodeURIComponent(match[index + 1]);
    });

    return { view: route.view, params };
  }

  return { view: NotFoundView, params: {} };
}

const app = document.querySelector('#app');

function setActiveNavLink(pathname) {
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const href = link.getAttribute('href').replace('#', '');
    // '/projects' stays active while viewing '/projects/eduerp'
    const isActive =
      href === pathname || (href !== '/' && pathname.startsWith(href));
    link.classList.toggle('active', isActive);
  });
}

async function renderRoute() {
  const pathname = location.hash.slice(1) || '/';
  const { view, params } = matchRoute(pathname);

  app.classList.add('is-leaving');
  await new Promise((resolve) => setTimeout(resolve, 120));   // let it fade out

  let html;
  try {
    html = await view.render(params);
  } catch (error) {
    html = `
      <div class="container page">
        ${pageHeader('Error', 'Content unavailable', 'The content could not be loaded. Check that the backend is running, then try again.')}
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>`;
  }

  // The View Transitions API animates between the old and new DOM where the
  // browser supports it. Everywhere else, the swap just happens.
  const swap = function () {
    app.innerHTML = html;
    app.classList.remove('is-leaving');
  };

  if (document.startViewTransition) {
    document.startViewTransition(swap);
  } else {
    swap();
  }

  document.title = view.title;
  setActiveNavLink(pathname);
  if (view.mount) view.mount();

  window.scrollTo({ top: 0, behavior: 'instant' });
  revealOnScroll();
}

// hashchange fires on every in-page navigation, including the back button —
// which is why history keeps working without any extra code.
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);


/* ==========================================================================
   5. SCROLL REVEAL
   Re-run after each render, since the elements are new every time.
   ========================================================================== */

function revealOnScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = app.querySelectorAll(
    '.hero > *, .page-head, .stat, .card, .timeline-item, .project-card, .skill-group, .two-col > div, .contact-form, .section-block'
  );

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry, index) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${Math.min(index * 60, 300)}ms`;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(function (element) {
    element.setAttribute('data-reveal', '');
    observer.observe(element);
  });
}


/* ==========================================================================
   6. CHROME — theme and menu
   These live outside the router because the header never re-renders.
   ========================================================================== */

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

function closeMenu() {
  navToggle.classList.remove('is-open');
  navLinks.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', function () {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.addEventListener('click', function (event) {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') closeMenu();
});

window.addEventListener('resize', function () {
  if (window.innerWidth > 880) closeMenu();
});

// Header gains a border and shadow once the page is scrolled.
const header = document.querySelector('.site-header');
window.addEventListener('scroll', function () {
  header.classList.toggle('is-scrolled', window.scrollY > 10);
});

// --- Theme ---
const themeToggle = document.querySelector('.theme-toggle');
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀' : '🌙';
  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

applyTheme(root.getAttribute('data-theme') || 'light');

themeToggle.addEventListener('click', function () {
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// Follow the system theme only while the visitor has not chosen one.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (event) {
  if (!localStorage.getItem('theme')) applyTheme(event.matches ? 'dark' : 'light');
});
