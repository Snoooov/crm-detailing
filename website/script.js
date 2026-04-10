const API_URL = 'https://crm.prestiq.pl/api/public/inquiries';

// ── NAVBAR ──────────────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── MOBILE NAV ───────────────────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const ro = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity  = '1';
      e.target.style.transform = 'translateY(0)';
      ro.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.svc-card,.gal-item,.rev-card,.proc-step,.acheck,.cinfo').forEach((el, i) => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = `opacity .5s ease ${i * .055}s, transform .5s ease ${i * .055}s`;
  ro.observe(el);
});

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formNote  = document.getElementById('formNote');

const note = (msg, type) => {
  formNote.textContent = msg;
  formNote.className   = 'form-note ' + (type || '');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name     = form.querySelector('#name').value.trim();
  const email    = form.querySelector('#email').value.trim();
  const phone    = form.querySelector('#phone').value.trim();
  const service  = form.querySelector('#service').value;
  const message  = form.querySelector('#message').value.trim();
  const honeypot = form.querySelector('[name="website"]').value;

  if (!name || name.length < 2) { note('Podaj imię i nazwisko.', 'err'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note('Podaj poprawny e-mail.', 'err'); return; }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Wysyłanie...';
  note('', '');

  try {
    const res  = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, phone, service, message, website: honeypot }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      submitBtn.textContent  = '✓ Wysłano!';
      submitBtn.style.background = '#16a34a';
      note('Dziękujemy! Odezwiemy się w ciągu 24 godzin.', 'ok');
      form.reset();
      setTimeout(() => {
        submitBtn.textContent  = 'Wyślij zapytanie';
        submitBtn.style.background = '';
        submitBtn.disabled     = false;
        note('Odpowiadamy w ciągu 24 godzin.', '');
      }, 5000);
    } else if (res.status === 429) {
      note('Zbyt wiele zgłoszeń. Spróbuj za godzinę.', 'err');
      submitBtn.textContent = 'Wyślij zapytanie';
      submitBtn.disabled    = false;
    } else {
      throw new Error(data.error || 'Błąd');
    }
  } catch {
    note('Coś poszło nie tak. Zadzwoń lub napisz e-mail bezpośrednio.', 'err');
    submitBtn.textContent = 'Wyślij zapytanie';
    submitBtn.disabled    = false;
  }
});
