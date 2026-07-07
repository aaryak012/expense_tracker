/* ================================================================
   AARYA SHIKHARE PORTFOLIO - script.js
   Animations · Interactions · Utilities
   ================================================================ */

'use strict';

/* ── DOM ready helper ── */
function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* ================================================================
   1. LOADING SCREEN
   ================================================================ */
function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      screen.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }, 800);
  });

  // Fallback after 2.5s
  setTimeout(() => screen.classList.add('hidden'), 2500);
}

/* ================================================================
   2. SCROLL PROGRESS BAR
   ================================================================ */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width    = pct + '%';
  }, { passive: true });
}

/* ================================================================
   3. NAVBAR: sticky + active link + hamburger
   ================================================================ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  const links     = document.querySelectorAll('.nav-link');

  // Sticky style
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink();
    toggleBackToTop();
  }, { passive: true });

  // Hamburger toggle
  hamburger && hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger && hamburger.classList.remove('open');
      hamburger && hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger && hamburger.classList.remove('open');
    }
  });

  // Active section highlighting
  function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(sec => {
      const top    = sec.offsetTop - 100;
      const bottom = top + sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bottom) current = sec.id;
    });

    links.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  updateActiveLink();
}

/* ================================================================
   4. BACK TO TOP
   ================================================================ */
function toggleBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.classList.toggle('visible', window.scrollY > 400);
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ================================================================
   5. SMOOTH SCROLL for anchor links
   ================================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ================================================================
   6. TYPING ANIMATION
   ================================================================ */
function initTypingAnimation() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const texts = [
    'EXTC Engineer',
    'AI Enthusiast',
    'Space Tech Explorer',
    'Android Developer',
    'IoT Builder',
    'Problem Solver',
  ];

  let textIndex  = 0;
  let charIndex  = 0;
  let isDeleting = false;
  let delay      = 120;

  function type() {
    const current = texts[textIndex];

    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      delay = 60;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      delay = 120;
    }

    if (!isDeleting && charIndex === current.length) {
      delay = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  type();
}

/* ================================================================
   7. PARTICLES CANVAS
   ================================================================ */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }

    reset() {
      this.x    = Math.random() * canvas.width;
      this.y    = Math.random() * canvas.height;
      this.vx   = (Math.random() - 0.5) * 0.4;
      this.vy   = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 1.8 + 0.4;
      this.alpha = Math.random() * 0.4 + 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height)  this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56,189,248,${this.alpha})`;
      ctx.fill();
    }
  }

  function createParticles(n) {
    particles = [];
    for (let i = 0; i < n; i++) particles.push(new Particle());
  }

  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const alpha = (1 - dist / maxDist) * 0.08;
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animId = requestAnimationFrame(animate);
  }

  resize();
  createParticles(70);
  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      createParticles(70);
    }, 200);
  });
}

/* ================================================================
   8. SCROLL REVEAL
   ================================================================ */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ================================================================
   9. ANIMATED COUNTERS
   ================================================================ */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.getAttribute('data-target')) || 0;
      const duration = 1800;
      const start  = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ================================================================
   10. SKILL BAR ANIMATION
   ================================================================ */
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar   = entry.target;
      const width = bar.getAttribute('data-width') || '0';
      // Slight delay for stagger effect
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 200);
      observer.unobserve(bar);
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
}

/* ================================================================
   11. RIPPLE EFFECT on buttons
   ================================================================ */
function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('ripple');

    btn.addEventListener('click', function(e) {
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2;
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

/* ================================================================
   12. CONTACT FORM VALIDATION
   ================================================================ */
function initContactForm() {
  const form      = document.getElementById('contact-form');
  if (!form) return;

  const fields = {
    name:    { el: document.getElementById('form-name'),    err: document.getElementById('name-error') },
    email:   { el: document.getElementById('form-email'),   err: document.getElementById('email-error') },
    subject: { el: document.getElementById('form-subject'), err: document.getElementById('subject-error') },
    message: { el: document.getElementById('form-message'), err: document.getElementById('message-error') },
  };

  const submitBtn  = document.getElementById('submit-btn');
  const successMsg = document.getElementById('form-success');

  function showError(field, msg) {
    field.el.classList.add('error');
    field.err.textContent = msg;
  }

  function clearError(field) {
    field.el.classList.remove('error');
    field.err.textContent = '';
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateField(key) {
    const field = fields[key];
    const val   = field.el.value.trim();

    if (!val) {
      showError(field, `${key.charAt(0).toUpperCase() + key.slice(1)} is required.`);
      return false;
    }
    if (key === 'email' && !validateEmail(val)) {
      showError(field, 'Please enter a valid email address.');
      return false;
    }
    if (key === 'name' && val.length < 2) {
      showError(field, 'Name must be at least 2 characters.');
      return false;
    }
    if (key === 'message' && val.length < 10) {
      showError(field, 'Message must be at least 10 characters.');
      return false;
    }

    clearError(field);
    return true;
  }

  // Live validation on blur
  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('blur', () => validateField(key));
    fields[key].el.addEventListener('input', () => {
      if (fields[key].el.classList.contains('error')) validateField(key);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const valid = Object.keys(fields).map(key => validateField(key)).every(Boolean);
    if (!valid) return;

    // Simulate submission
    const textSpan    = submitBtn.querySelector('.submit-text');
    const loadSpan    = submitBtn.querySelector('.submit-loading');
    submitBtn.disabled = true;
    textSpan.style.display  = 'none';
    loadSpan.style.display  = 'flex';

    setTimeout(() => {
      submitBtn.disabled = false;
      textSpan.style.display = '';
      loadSpan.style.display = 'none';
      successMsg.style.display = 'flex';
      form.reset();

      setTimeout(() => {
        successMsg.style.display = 'none';
      }, 5000);
    }, 1500);
  });
}

/* ================================================================
   13. CARD TILT on project cards
   ================================================================ */
function initCardTilt() {
  const cards = document.querySelectorAll('.project-card, .cert-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const cx     = rect.width / 2;
      const cy     = rect.height / 2;
      const rotX   = ((y - cy) / cy) * -5;
      const rotY   = ((x - cx) / cx) *  5;

      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease';
    });
  });
}

/* ================================================================
   14. FOOTER YEAR
   ================================================================ */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ================================================================
   15. PROFILE IMAGE FALLBACK (no-op — image set directly in HTML)
   ================================================================ */
function initProfileFallback() {}

/* ================================================================
   16. ABOUT images (no-op — image set directly in HTML)
   ================================================================ */
function initAboutImages() {}

/* ================================================================
   17. KEYBOARD ACCESSIBILITY - Escape closes mobile menu
   ================================================================ */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const navLinks  = document.getElementById('nav-links');
      const hamburger = document.getElementById('hamburger');
      navLinks  && navLinks.classList.remove('open');
      hamburger && hamburger.classList.remove('open');
    }
  });
}

/* ================================================================
   18. SKILL CARD stagger reveal delay
   ================================================================ */
function initSkillStagger() {
  document.querySelectorAll('.skills-category').forEach(cat => {
    cat.querySelectorAll('.skill-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.08}s`;
    });
  });
}

/* ================================================================
   19. STAT CARD hover glow
   ================================================================ */
function initStatGlow() {
  const colors = ['#38BDF8', '#8B5CF6', '#10B981', '#F97316'];

  document.querySelectorAll('.stat-card').forEach((card, i) => {
    const color = colors[i % colors.length];
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px ${color}25`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
    });
  });
}

/* ================================================================
   20. LAZY LOAD images
   ================================================================ */
function initLazyLoad() {
  if (!('IntersectionObserver' in window)) return;

  const images = document.querySelectorAll('img[loading="lazy"]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
}

/* ================================================================
   21. FLOATING BADGES subtle pulse
   ================================================================ */
function initBadgePulse() {
  document.querySelectorAll('.floating-badge').forEach(badge => {
    badge.addEventListener('mouseenter', () => {
      badge.style.transform  = 'scale(1.05)';
      badge.style.boxShadow  = '0 8px 24px rgba(56,189,248,0.2)';
      badge.style.borderColor = 'rgba(56,189,248,0.3)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform  = '';
      badge.style.boxShadow  = '';
      badge.style.borderColor = '';
    });
  });
}

/* ================================================================
   22. TOOL PILL stagger
   ================================================================ */
function initToolPillStagger() {
  document.querySelectorAll('.tool-pill').forEach((pill, i) => {
    pill.style.animationDelay = `${i * 0.05}s`;
  });
}

/* ================================================================
   23. TIMELINE smooth entrance
   ================================================================ */
function initTimelineAnimation() {
  document.querySelectorAll('.timeline-item').forEach((item, i) => {
    const isEven = i % 2 === 1;
    const card   = item.querySelector('.timeline-card');
    if (!card) return;

    card.classList.remove('reveal-up');
    card.classList.add(isEven ? 'reveal-right' : 'reveal-left');
  });
}

/* ================================================================
   24. CURSOR GLOW (subtle mouse trail on hero)
   ================================================================ */
function initCursorGlow() {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(hover: none)').matches) return;

  const glow = document.createElement('div');
  glow.style.cssText = `
    position:absolute; pointer-events:none; z-index:0;
    width:300px; height:300px; border-radius:50%;
    background:radial-gradient(circle, rgba(56,189,248,0.04), transparent 70%);
    transform:translate(-50%,-50%);
    transition:left 0.3s ease, top 0.3s ease;
  `;
  hero.appendChild(glow);

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    glow.style.left = (e.clientX - rect.left) + 'px';
    glow.style.top  = (e.clientY - rect.top)  + 'px';
  });
}

/* ================================================================
   INIT ALL
   ================================================================ */
onReady(() => {
  initLoadingScreen();
  initScrollProgress();
  initNavbar();
  initBackToTop();
  initSmoothScroll();
  initTypingAnimation();
  initParticles();
  initScrollReveal();
  initCounters();
  initSkillBars();
  initRipple();
  initContactForm();
  initCardTilt();
  initFooterYear();
  initProfileFallback();
  initAboutImages();
  initKeyboard();
  initSkillStagger();
  initStatGlow();
  initLazyLoad();
  initBadgePulse();
  initToolPillStagger();
  initTimelineAnimation();
  initCursorGlow();

  // Hide loading screen once everything is set up
  document.body.style.overflow = '';
});
