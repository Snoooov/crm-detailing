// ─── NAVBAR SCROLL ───────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ─── MOBILE NAV ──────────────────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ─── STATS COUNTER ───────────────────────────────────────────────────────────
const counters = document.querySelectorAll('.stat-num');

const animateCounter = (el) => {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const update = () => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current);
    if (current < target) requestAnimationFrame(update);
  };
  update();
};

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => statsObserver.observe(c));

// ─── SCROLL ANIMATIONS ────────────────────────────────────────────────────────
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      animObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.service-card, .gallery-item, .testimonial-card, .process-step').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  animObserver.observe(el);
});

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Wysyłanie...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Wysłano! Odezwiemy się wkrótce.';
    btn.style.background = 'linear-gradient(135deg, #4a9a6a, #2d7a50)';
    e.target.reset();
    setTimeout(() => {
      btn.textContent = 'Wyślij zapytanie';
      btn.style.background = '';
      btn.disabled = false;
    }, 4000);
  }, 1200);
});
