/* ==========================================================================
   PORTFOLIO — script.js

   A small bilingual single-page application, written by hand.

   1. Language      — current locale, UI strings, persistence
   2. Data layer    — content fetching, API first with a static fallback
   3. Helpers       — escaping and small HTML builders
   4. Views         — one object per page
   5. Router        — maps the URL hash to a view
   6. Chrome        — theme, language and menu controls
   7. Contact form  — delegated submit handler
   ========================================================================== */

'use strict';


/* ==========================================================================
   1. LANGUAGE
   ========================================================================== */

const SUPPORTED_LANGS = ['en', 'fr'];

function detectLang() {
  const saved = localStorage.getItem('lang');
  if (SUPPORTED_LANGS.includes(saved)) return saved;
  // navigator.language looks like 'fr-FR'; take the part before the dash.
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(browser) ? browser : 'en';
}

let LANG = detectLang();

// Interface strings. Content comes from the JSON files; these are the labels
// around it — navigation, page titles, buttons, form fields.
const STRINGS = {
  en: {
    nav: { home: 'Home', experience: 'Experience', projects: 'Projects', background: 'Background', contact: 'Contact' },
    home: { seeWork: 'See my work', getInTouch: 'Get in touch', whatIDo: 'What I do', ctaTitle: "Let's talk", ctaIntro: 'Questions, ideas or a project in mind? Email is the quickest way to reach me.' },
    experience: { eyebrow: 'Experience', title: 'Where I have worked', intro: 'Three years building and running ERP and SaaS platforms, and a first commercial role before that.' },
    projects: { eyebrow: 'Projects', title: 'What I have built', intro: 'Production systems at work, and this site.', readMore: 'Read more' },
    detail: { back: 'Back to projects', role: 'My role', stack: 'Stack', features: 'What it does', sourceCode: 'Source code', visitSite: 'Visit site', private: 'This is client work, so the source is not public.' },
    background: { eyebrow: 'Background', title: 'Skills and education', intro: 'What I work with, and where I learned it.', skills: 'Skills', education: 'Education', certifications: 'Certifications', languages: 'Languages' },
    contact: { eyebrow: 'Contact', title: "Let's talk", intro: 'The quickest way to reach me is by email — I read everything and reply within a couple of days.', emailLabel: 'Email', emailAction: 'Write to me', linkedinLabel: 'LinkedIn', linkedinAction: 'Connect', githubLabel: 'GitHub', githubAction: 'See my code', primary: 'Send me an email', subject: 'Hello Khadija' },
    notFound: { eyebrow: '404', title: 'This page does not exist', intro: 'The link may be out of date.', home: 'Back to home' },
    error: { eyebrow: 'Error', title: 'Content unavailable', intro: 'The content could not be loaded. Please try again.', retry: 'Retry' },
    loading: 'Loading…',
  },
  fr: {
    nav: { home: 'Accueil', experience: 'Expérience', projects: 'Projets', background: 'Parcours', contact: 'Contact' },
    home: { seeWork: 'Voir mes projets', getInTouch: 'Me contacter', whatIDo: 'Ce que je fais', ctaTitle: 'Discutons', ctaIntro: 'Une question, une idée ou un projet ? L\u2019e-mail est le moyen le plus simple de me joindre.' },
    experience: { eyebrow: 'Expérience', title: 'Mon parcours professionnel', intro: 'Trois ans à concevoir et exploiter des plateformes ERP et SaaS, précédés d\u2019une première expérience commerciale.' },
    projects: { eyebrow: 'Projets', title: 'Ce que j\u2019ai construit', intro: 'Des systèmes en production, et ce site.', readMore: 'En savoir plus' },
    detail: { back: 'Retour aux projets', role: 'Mon rôle', stack: 'Technologies', features: 'Fonctionnalités', sourceCode: 'Code source', visitSite: 'Voir le site', private: 'Projet client : le code source n\u2019est pas public.' },
    background: { eyebrow: 'Parcours', title: 'Compétences et formation', intro: 'Les technologies que j\u2019utilise, et où je les ai apprises.', skills: 'Compétences', education: 'Formation', certifications: 'Certifications', languages: 'Langues' },
    contact: { eyebrow: 'Contact', title: 'Discutons', intro: 'Le plus simple est de m\u2019écrire par e-mail : je lis tout et réponds sous quelques jours.', emailLabel: 'E-mail', emailAction: 'M\u2019écrire', linkedinLabel: 'LinkedIn', linkedinAction: 'Se connecter', githubLabel: 'GitHub', githubAction: 'Voir mon code', primary: 'M\u2019envoyer un e-mail', subject: 'Bonjour Khadija' },
    notFound: { eyebrow: '404', title: 'Cette page n\u2019existe pas', intro: 'Le lien est peut-être obsolète.', home: 'Retour à l\u2019accueil' },
    error: { eyebrow: 'Erreur', title: 'Contenu indisponible', intro: 'Le contenu n\u2019a pas pu être chargé. Veuillez réessayer.', retry: 'Réessayer' },
    loading: 'Chargement…',
  },
};

// Short accessor: t().nav.home
function t() {
  return STRINGS[LANG];
}


/* ==========================================================================
   2. DATA LAYER
   ========================================================================== */

const API_BASE =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : '';   // set to your Render URL once the backend is deployed

const cache = new Map();

/**
 * Load a content file for the current language.
 *
 * Tries the FastAPI backend first, then falls back to the same JSON files
 * served as static assets. One source of truth, two ways to reach it — so
 * the site stays readable when the backend is asleep or not deployed.
 */
async function getContent(name) {
  const key = `${LANG}:${name}`;
  if (cache.has(key)) return cache.get(key);

  const sources = [];
  if (API_BASE) sources.push(`${API_BASE}/api/${name}?lang=${LANG}`);
  sources.push(`content/${LANG}/${name}.json`);
  sources.push(`content/en/${name}.json`);

  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      cache.set(key, data);
      return data;
    } catch (error) {
      // try the next source
    }
  }

  throw new Error(`Could not load ${name}`);
}


/* ==========================================================================
   3. HELPERS
   ========================================================================== */

// Content is inserted with innerHTML, so every value must be escaped first.
function esc(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function tagList(items) {
  if (!items || !items.length) return '';
  return `<ul class="tags">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
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
   4. VIEWS
   ========================================================================== */

const HomeView = {
  get title() { return 'Khadija Elamri — Full-Stack Developer'; },

  async render() {
    const profile = await getContent('profile');
    const s = t().home;

    const highlights = profile.highlights
      .map((item) => `
        <div class="stat">
          <span class="stat-number">${esc(item.value)}</span>
          <span class="stat-label">${esc(item.label)}</span>
        </div>`)
      .join('');

    const expertise = profile.expertise
      .map((item) => `
        <article class="card">
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`)
      .join('');

    return `
      <section class="hero container">
        ${profile.badge ? `<p class="hero-badge">${esc(profile.badge)}</p>` : ''}
        <h1>${esc(profile.name)}</h1>
        <p class="hero-title">${esc(profile.title)}</p>
        <p class="hero-tagline">${esc(profile.tagline)}</p>

        <div class="hero-actions">
          <a href="#/projects" class="btn btn-primary">${esc(s.seeWork)}</a>
          <a href="#/contact" class="btn btn-secondary">${esc(s.getInTouch)}</a>
        </div>

        <ul class="hero-links">
          <li><a href="${esc(profile.links.github)}">GitHub</a></li>
          <li><a href="${esc(profile.links.linkedin)}">LinkedIn</a></li>
          <li><a href="mailto:${esc(profile.links.email)}">Email</a></li>
        </ul>
      </section>

      <section class="stats container">${highlights}</section>

      <section class="section container">
        <h2>${esc(s.whatIDo)}</h2>
        <div class="cards">${expertise}</div>
      </section>

      <section class="section container">
        <h2>${esc(s.ctaTitle)}</h2>
        <p class="section-intro">${esc(s.ctaIntro)}</p>
        <a href="#/contact" class="btn btn-primary">${esc(s.getInTouch)}</a>
      </section>
    `;
  },
};


const ExperienceView = {
  get title() { return `${t().experience.title} — Khadija Elamri`; },

  async render() {
    const roles = await getContent('experience');
    const s = t().experience;

    const items = roles
      .map((role) => `
        <li class="role${role.current ? ' is-current' : ''}">
          <div class="role-head">
            <div>
              <h3 class="role-title">${esc(role.role)}</h3>
              <p class="role-company">
                <span>${esc(role.company)}</span>
                <span class="role-sep">·</span>
                <span>${esc(role.location)}</span>
              </p>
            </div>
            <p class="role-period">${esc(role.period)}</p>
          </div>

          ${role.summary ? `<p class="role-summary">${esc(role.summary)}</p>` : ''}

          <ul class="role-points">
            ${role.highlights.map((point) => `<li>${esc(point)}</li>`).join('')}
          </ul>

          ${tagList(role.stack)}
        </li>`)
      .join('');

    return `
      <div class="container page">
        ${pageHeader(s.eyebrow, s.title, s.intro)}
        <ol class="roles">${items}</ol>
      </div>
    `;
  },
};


const ProjectsView = {
  get title() { return `${t().projects.title} — Khadija Elamri`; },

  async render() {
    const projects = await getContent('projects');
    const s = t().projects;

    const cards = projects
      .map((project) => `
        <a class="project-card" href="#/projects/${esc(project.slug)}">
          <h3>${esc(project.title)}</h3>
          <p class="project-type">${esc(project.kind)}</p>
          <p>${esc(project.description)}</p>
          ${tagList(project.tags)}
          <p class="project-links"><span>${esc(s.readMore)}</span></p>
        </a>`)
      .join('');

    return `
      <div class="container page">
        ${pageHeader(s.eyebrow, s.title, s.intro)}
        <div class="projects-grid">${cards}</div>
      </div>
    `;
  },
};


const ProjectDetailView = {
  title: 'Khadija Elamri',

  async render(params) {
    const projects = await getContent('projects');
    const project = projects.find((item) => item.slug === params.slug);
    if (!project) return NotFoundView.render();

    this.title = `${project.title} — Khadija Elamri`;
    const s = t().detail;

    const links = [
      project.repo_url ? `<a class="btn btn-secondary" href="${esc(project.repo_url)}">${esc(s.sourceCode)}</a>` : '',
      project.live_url ? `<a class="btn btn-primary" href="${esc(project.live_url)}">${esc(s.visitSite)}</a>` : '',
    ].join('');

    const features = (project.features || [])
      .map((item) => `
        <article class="feature">
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.description)}</p>
        </article>`)
      .join('');

    return `
      <div class="container page">
        <a class="back-link" href="#/projects">${esc(s.back)}</a>

        ${pageHeader(project.kind, project.title, project.description)}

        <div class="detail-grid">
          <section>
            <h2>${esc(s.role)}</h2>
            <p>${esc(project.role || '')}</p>
          </section>
          <section>
            <h2>${esc(s.stack)}</h2>
            ${tagList(project.tags)}
          </section>
        </div>

        ${features ? `
          <section class="feature-list">
            <h2>${esc(s.features)}</h2>
            ${features}
          </section>` : ''}

        ${links ? `<div class="hero-actions">${links}</div>`
                : `<p class="note">${esc(s.private)}</p>`}
      </div>
    `;
  },
};


const BackgroundView = {
  get title() { return `${t().background.title} — Khadija Elamri`; },

  async render() {
    // Promise.all runs both requests at once instead of one after the other.
    const [skills, background] = await Promise.all([
      getContent('skills'),
      getContent('education'),
    ]);
    const s = t().background;

    const skillGroups = skills
      .map((group) => `
        <div class="skill-group">
          <h3>${esc(group.group)}</h3>
          ${tagList(group.items)}
        </div>`)
      .join('');

    const education = background.education
      .map((item) => `
        <li>
          <strong>${esc(item.degree)}</strong>
          <span>${esc([item.school, item.year].filter(Boolean).join(' · '))}</span>
        </li>`)
      .join('');

    const certifications = background.certifications
      .map((item) => `
        <li>
          <strong>${esc(item.name)}</strong>
          <span>${esc([item.issuer, item.year].filter(Boolean).join(' · '))}</span>
        </li>`)
      .join('');

    const languages = background.languages
      .map((item) => `<li>${esc(item.language)} — ${esc(item.level)}</li>`)
      .join('');

    return `
      <div class="container page">
        ${pageHeader(s.eyebrow, s.title, s.intro)}

        <section class="section-block">
          <h2>${esc(s.skills)}</h2>
          <div class="skills-groups">${skillGroups}</div>
        </section>

        <section class="section-block">
          <div class="two-col">
            <div>
              <h2>${esc(s.education)}</h2>
              <ul class="plain-list">${education}</ul>
            </div>
            <div>
              <h2>${esc(s.certifications)}</h2>
              <ul class="plain-list">${certifications}</ul>
            </div>
          </div>
        </section>

        <section class="section-block">
          <h2>${esc(s.languages)}</h2>
          <ul class="tags">${languages}</ul>
        </section>
      </div>
    `;
  },
};


const ContactView = {
  get title() { return `${t().contact.title} — Khadija Elamri`; },

  async render() {
    const profile = await getContent('profile');
    const s = t().contact;

    // A pre-filled subject line means the message arrives already labelled.
    const mailto = `mailto:${profile.links.email}?subject=${encodeURIComponent(s.subject)}`;

    // Show the handle rather than the full URL: take the last path segment.
    const handle = function (url) {
      return url.replace(/\/$/, '').split('/').pop();
    };

    const methods = [
      { label: s.emailLabel, value: profile.links.email, action: s.emailAction, href: mailto, primary: true },
      { label: s.linkedinLabel, value: handle(profile.links.linkedin), action: s.linkedinAction, href: profile.links.linkedin },
      { label: s.githubLabel, value: handle(profile.links.github), action: s.githubAction, href: profile.links.github },
    ];

    const cards = methods
      .map((item) => `
        <a class="contact-card${item.primary ? ' is-primary' : ''}" href="${esc(item.href)}"
           ${item.primary ? '' : 'target="_blank" rel="noopener"'}>
          <p class="contact-label">${esc(item.label)}</p>
          <p class="contact-value">${esc(item.value)}</p>
          <p class="contact-action">${esc(item.action)}</p>
        </a>`)
      .join('');

    return `
      <div class="container page">
        ${pageHeader(s.eyebrow, s.title, s.intro)}

        <div class="contact-grid">${cards}</div>

        <div class="hero-actions contact-cta">
          <a class="btn btn-primary" href="${esc(mailto)}">${esc(s.primary)}</a>
        </div>
      </div>
    `;
  },
};


const NotFoundView = {
  get title() { return `${t().notFound.title} — Khadija Elamri`; },
  async render() {
    const s = t().notFound;
    return `
      <div class="container page">
        ${pageHeader(s.eyebrow, s.title, s.intro)}
        <a href="#/" class="btn btn-primary">${esc(s.home)}</a>
      </div>
    `;
  },
};


/* ==========================================================================
   5. ROUTER
   ========================================================================== */

const routes = [
  { path: '/',               view: HomeView },
  { path: '/experience',     view: ExperienceView },
  { path: '/projects',       view: ProjectsView },
  { path: '/projects/:slug', view: ProjectDetailView },
  { path: '/background',     view: BackgroundView },
  { path: '/contact',        view: ContactView },
];

/**
 * Turn '/projects/:slug' into a regular expression that captures the value,
 * so '/projects/eduerp' yields { slug: 'eduerp' }.
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
    const isActive = href === pathname || (href !== '/' && pathname.startsWith(href));
    link.classList.toggle('active', isActive);
  });
}

async function renderRoute() {
  const pathname = location.hash.slice(1) || '/';
  const { view, params } = matchRoute(pathname);

  app.classList.add('is-leaving');
  await new Promise((resolve) => setTimeout(resolve, 110));

  let html;
  try {
    html = await view.render(params);
  } catch (error) {
    const s = t().error;
    html = `
      <div class="container page">
        ${pageHeader(s.eyebrow, s.title, s.intro)}
        <button class="btn btn-primary" onclick="location.reload()">${esc(s.retry)}</button>
      </div>`;
  }

  const swap = function () {
    app.innerHTML = html;
    app.classList.remove('is-leaving');
  };

  // The View Transitions API animates the swap where the browser supports it.
  if (document.startViewTransition) {
    document.startViewTransition(swap);
  } else {
    swap();
  }

  document.title = view.title;
  setActiveNavLink(pathname);
  window.scrollTo({ top: 0, behavior: 'instant' });
  revealOnScroll();
}

// hashchange fires on every in-page navigation, including the back button,
// which is why history works without any extra code.
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', function () {
  applyLanguage(LANG);
  renderRoute();
});


/* ==========================================================================
   6. SCROLL REVEAL
   ========================================================================== */

function revealOnScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = app.querySelectorAll(
    '.hero > *, .page-head, .stat, .card, .role, .project-card, .skill-group, .two-col > div, .contact-card, .section-block, .feature'
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
   7. CHROME — language, theme, menu
   These live outside the router because the header never re-renders.
   ========================================================================== */

const langToggle = document.querySelector('.lang-toggle');

function applyLanguage(lang) {
  LANG = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.setAttribute('lang', lang);

  // Nav labels are translated in place, using the data-nav key on each link.
  document.querySelectorAll('.nav-links a[data-nav]').forEach(function (link) {
    link.textContent = t().nav[link.dataset.nav];
  });

  // The button shows the language you would switch TO.
  langToggle.textContent = lang === 'fr' ? 'EN' : 'FR';
  langToggle.setAttribute('aria-label', lang === 'fr' ? 'Switch to English' : 'Passer en français');
}

langToggle.addEventListener('click', function () {
  applyLanguage(LANG === 'fr' ? 'en' : 'fr');
  renderRoute();                 // re-render the current page in the new language
});

// --- Menu ---
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
  themeToggle.setAttribute('aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

applyTheme(root.getAttribute('data-theme') || 'light');

themeToggle.addEventListener('click', function () {
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (event) {
  if (!localStorage.getItem('theme')) applyTheme(event.matches ? 'dark' : 'light');
});
