/* ===================================
   IDSF Japan — Main JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.revealDelay;
          if (delay) {
            setTimeout(() => entry.target.classList.add('revealed'), delay * 150);
          } else {
            entry.target.classList.add('revealed');
          }
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // --- Header scroll effect ---
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Mobile menu ---
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // --- Contact form validation ---
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('has-error');
      });

      const name = form.querySelector('#name');
      if (name && !name.value.trim()) {
        name.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      const email = form.querySelector('#email');
      if (email && (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))) {
        email.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      const message = form.querySelector('#message');
      if (message && !message.value.trim()) {
        message.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      if (isValid) {
        form.style.display = 'none';
        const success = document.querySelector('.form-success');
        if (success) success.classList.add('show');
      }
    });
  }

  // --- Event accordion ---
  const accordions = document.querySelectorAll('.event-accordion');
  accordions.forEach(accordion => {
    const header = accordion.querySelector('.event-header');
    const details = accordion.querySelector('.event-details');
    if (!header || !details) return;

    const toggle = () => {
      const isOpen = accordion.classList.contains('open');

      // Close all others
      accordions.forEach(other => {
        if (other !== accordion && other.classList.contains('open')) {
          other.classList.remove('open');
          const otherDetails = other.querySelector('.event-details');
          const otherHeader = other.querySelector('.event-header');
          if (otherDetails) otherDetails.style.maxHeight = '0';
          if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      if (isOpen) {
        accordion.classList.remove('open');
        details.style.maxHeight = '0';
        header.setAttribute('aria-expanded', 'false');
      } else {
        accordion.classList.add('open');
        details.style.maxHeight = details.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
      }
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
