// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────
const API_URL = 'https://crm.prestiq.pl/api/public/inquiries';

// ─── NAVBAR SCROLL ───────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ─── MOBILE NAV ──────────────────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity  = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.svc-card, .g-item, .review-card, .proc-step, .about-item, .info-item'
).forEach((el, i) => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = `opacity 0.55s ease ${i * 0.06}s, transform 0.55s ease ${i * 0.06}s`;
  revealObserver.observe(el);
});

// ─── CONTACT FORM — wysyłka do CRM ────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');
const formNote    = document.getElementById('formNote');

const setNote = (msg, type) => {
  formNote.textContent = msg;
  formNote.className = 'form-note ' + (type || '');
};

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = contactForm.querySelector('#name').value.trim();
  const email   = contactForm.querySelector('#email').value.trim();
  const phone   = contactForm.querySelector('#phone').value.trim();
  const service = contactForm.querySelector('#service').value;
  const message = contactForm.querySelector('#message').value.trim();
  const honeypot = contactForm.querySelector('#website').value;

  // Podstawowa walidacja po stronie klienta
  if (!name || name.length < 2) {
    setNote('Podaj imię i nazwisko.', 'error');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setNote('Podaj poprawny adres e-mail.', 'error');
    return;
  }

  submitBtn.disabled   = true;
  submitBtn.textContent = 'Wysyłanie...';
  setNote('', '');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, service, message, website: honeypot }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      submitBtn.textContent = '✓ Wysłano!';
      submitBtn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
      setNote('Dziękujemy! Odezwiemy się w ciągu 24 godzin.', 'success');
      contactForm.reset();

      setTimeout(() => {
        submitBtn.textContent  = 'Wyślij zapytanie';
        submitBtn.style.background = '';
        submitBtn.disabled = false;
        setNote('Odpowiadamy w ciągu 24 godzin.', '');
      }, 5000);

    } else if (res.status === 429) {
      setNote('Wysłałeś zbyt wiele zgłoszeń. Spróbuj za godzinę.', 'error');
      submitBtn.textContent = 'Wyślij zapytanie';
      submitBtn.disabled = false;
    } else {
      throw new Error(data.error || 'Błąd serwera');
    }

  } catch (err) {
    console.error(err);
    setNote('Coś poszło nie tak. Zadzwoń do nas lub wyślij e-mail bezpośrednio.', 'error');
    submitBtn.textContent = 'Wyślij zapytanie';
    submitBtn.disabled = false;
  }
});
