/* ==========================================================================
   APPEND TO THE END OF script.js
   Section 8: scroll reveal.

   The elements to animate are tagged from JavaScript rather than by hand in
   the HTML, so the markup stays clean and new sections are picked up
   automatically. Each group is staggered so items arrive in sequence.
   ========================================================================== */

   (function initScrollReveal() {
    // If the visitor asked their system for less motion, do nothing at all.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;
  
    // Groups of elements that should animate in together, in order.
    const targets = document.querySelectorAll(
      '.hero > *, .stat, .card, .timeline-item, .project-card, .skill-group, .two-col > div, .contact-form'
    );
  
    targets.forEach(function (element) {
      element.setAttribute('data-reveal', '');
    });
  
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (!entry.isIntersecting) return;
  
          // transitionDelay staggers items that appear at the same time.
          // Capped so a long list never feels slow.
          const delay = Math.min(index * 70, 350);
          entry.target.style.transitionDelay = `${delay}ms`;
          entry.target.classList.add('is-visible');
  
          // Reveal once, then stop watching — the animation should not
          // replay every time the visitor scrolls back up.
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',   // trigger slightly before it is fully in view
      }
    );
  
    targets.forEach(function (element) {
      revealObserver.observe(element);
    });
  })();