/* ==========================================================================
   PORTFOLIO — script.js
   Step 7: mobile menu, active nav link, header on scroll.
   ========================================================================== */

/* 'use strict' makes JavaScript stricter about mistakes: it turns silent
   errors (like using an undeclared variable) into visible ones. */
   'use strict';


   /* ==========================================================================
      1. MOBILE MENU
      The CSS already knows how to look open or closed. JavaScript's only job
      is to add or remove the .is-open class and keep the accessibility
      attribute in sync.
      ========================================================================== */
   
   // querySelector finds the FIRST element matching a CSS selector.
   const navToggle = document.querySelector('.nav-toggle');
   const navLinks  = document.querySelector('.nav-links');
   
   function closeMenu() {
     navToggle.classList.remove('is-open');
     navLinks.classList.remove('is-open');
     // Tells screen readers the menu is collapsed. Without this, a blind user
     // has no way to know whether the button opened anything.
     navToggle.setAttribute('aria-expanded', 'false');
     navToggle.setAttribute('aria-label', 'Open menu');
   }
   
   function openMenu() {
     navToggle.classList.add('is-open');
     navLinks.classList.add('is-open');
     navToggle.setAttribute('aria-expanded', 'true');
     navToggle.setAttribute('aria-label', 'Close menu');
   }
   
   // addEventListener says: "when this event happens on this element, run this
   // function". It is the core of all interactivity in the browser.
   navToggle.addEventListener('click', function () {
     // classList.contains asks whether the class is currently there.
     const isOpen = navLinks.classList.contains('is-open');
     isOpen ? closeMenu() : openMenu();
   });
   
   // Close the menu after tapping a link, otherwise the panel stays open
   // covering the section the visitor just asked to see.
   navLinks.addEventListener('click', function (event) {
     // event.target is the exact element that was clicked.
     // .closest('a') walks up the tree to find the nearest link, so this works
     // even if the click lands on something nested inside the link.
     if (event.target.closest('a')) {
       closeMenu();
     }
   });
   
   // Escape closes the menu — a convention keyboard users expect.
   document.addEventListener('keydown', function (event) {
     if (event.key === 'Escape') {
       closeMenu();
     }
   });
   
   // If the window is resized up to desktop width while the menu is open,
   // clean up the state so it does not reappear oddly later.
   window.addEventListener('resize', function () {
     if (window.innerWidth > 860) {
       closeMenu();
     }
   });
   
   
   /* ==========================================================================
      2. ACTIVE NAV LINK ("scroll spy")
      Highlights the nav link matching whichever section is on screen.
   
      The naive way is to listen to every scroll event and measure positions —
      which runs hundreds of times a second. IntersectionObserver is the modern
      way: the browser watches the elements for us and only calls back when
      something actually enters or leaves the viewport.
      ========================================================================== */
   
   // querySelectorAll returns ALL matches, as a list we can loop over.
   const sections = document.querySelectorAll('main section[id]');
   const navAnchors = document.querySelectorAll('.nav-links a');
   
   function setActiveLink(id) {
     navAnchors.forEach(function (anchor) {
       // getAttribute('href') gives us "#about"; compare it to "#" + the id.
       const isMatch = anchor.getAttribute('href') === '#' + id;
       anchor.classList.toggle('active', isMatch);
     });
   }
   
   const observer = new IntersectionObserver(
     function (entries) {
       entries.forEach(function (entry) {
         if (entry.isIntersecting) {
           setActiveLink(entry.target.id);
         }
       });
     },
     {
       // A section counts as "current" when it crosses the upper-middle of the
       // screen. The negative offsets shrink the detection zone to a band:
       // 30% down from the top, 55% up from the bottom.
       rootMargin: '-30% 0px -55% 0px',
     }
   );
   
   sections.forEach(function (section) {
     observer.observe(section);
   });
   
   
   /* ==========================================================================
      3. HEADER ON SCROLL
      Adds a class once the page has scrolled, so the sticky header can lift
      off the page with a subtle shadow.
      ========================================================================== */
   
   const header = document.querySelector('.site-header');
   
   window.addEventListener('scroll', function () {
     // window.scrollY is how many pixels the page has scrolled from the top.
     header.classList.toggle('is-scrolled', window.scrollY > 10);
   });