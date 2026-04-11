# Prestiq Car Spa — CRM System

System zarządzania warsztatem auto detailingu — zlecenia, klienci, pojazdy, pracownicy, katalog usług, maile automatyczne, raporty, kalendarz iCal, zgłoszenia ze strony www.

---

## Spis treści

1. [Technologie](#technologie)
2. [Struktura projektu](#struktura-projektu)
3. [Uruchomienie](#uruchomienie)
4. [Konfiguracja](#konfiguracja)
5. [Schemat bazy danych](#schemat-bazy-danych)
6. [Funkcje systemu](#funkcje-systemu)
7. [API — endpointy](#api--endpointy)
8. [Role użytkowników](#role-użytkowników)
9. [Bezpieczeństwo](#bezpieczeństwo)
10. [Wdrożenie na VPS](#wdrożenie-na-vps)

---

## Technologie

| Warstwa | Stack |
|---|---|
| Backend | Node.js 18+, Express, PostgreSQL (`pg`), JWT |
| Autentykacja | bcryptjs, jsonwebtoken, speakeasy (TOTP 2FA), qrcode |
| Email | nodemailer (Gmail), node-cron |
| PDF | puppeteer |
| Bezpieczeństwo | helmet, express-rate-limit, cors |
| Frontend CRM | React 19, Vite, React Router, axios |
| Strona www | HTML5, CSS3 (vanilla), ES Modules |

---

## Struktura projektu

```
autodetailing-crm/
├── backend/
│   ├── src/
│   │   ├── index.js                  ← entry point, Express + rejestracja tras
│   │   ├── config/
│   │   │   ├── appConfig.js          ← CENTRALNA KONFIGURACJA APLIKACJI ★
│   │   │   └── db.js                 ← pool PostgreSQL + auto-migracja przy starcie
│   │   ├── middleware/
│   │   │   └── auth.js               ← JWT: auth, adminOnly, managerOrAdmin
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── clientController.js
│   │   │   ├── orderController.js
│   │   │   └── vehicleController.js
│   │   ├── models/
│   │   │   ├── clientModel.js
│   │   │   ├── orderModel.js
│   │   │   └── vehicleModel.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── clientRoutes.js
│   │   │   ├── vehicleRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── serviceRoutes.js      ← katalog usług
│   │   │   ├── assignmentRoutes.js
│   │   │   ├── noteRoutes.js
│   │   │   ├── emailRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── searchRoutes.js
│   │   │   ├── pdfRoutes.js
│   │   │   ├── reportRoutes.js       ← raporty i statystyki (admin + manager)
│   │   │   ├── icalRoutes.js         ← subskrypcja kalendarza iCal
│   │   │   ├── campaignRoutes.js     ← kampanie mailowe
│   │   │   ├── logsRoutes.js         ← logi systemowe (admin)
│   │   │   ├── settingsRoutes.js     ← ustawienia firmy
│   │   │   ├── inquiryRoutes.js      ← zgłoszenia ze strony www (publiczny POST + admin GET/PATCH/DELETE)
│   │   │   └── twoFactorRoutes.js
│   │   └── services/
│   │       ├── emailService.js       ← wysyłanie emaili, szablony HTML, logi
│   │       ├── emailScheduler.js     ← cron, automatyczne maile
│   │       └── pdfService.js         ← generowanie PDF (puppeteer)
│   ├── seed_orders.js                ← skrypt do generowania zleceń testowych
│   ├── .env                          ← zmienne środowiskowe (nie commitować!)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── config.js                 ← CENTRALNA KONFIGURACJA FRONTENDU ★
│   │   ├── main.jsx
│   │   ├── App.jsx                   ← routing aplikacji
│   │   ├── index.css                 ← globalne style, CSS variables, dark mode
│   │   ├── api/
│   │   │   └── axios.js              ← konfiguracja axios, interceptory JWT
│   │   ├── constants/
│   │   │   └── orderStatuses.js      ← współdzielone etykiety i kolory statusów
│   │   ├── hooks/
│   │   │   └── useDarkMode.js        ← MutationObserver na body.dark
│   │   ├── context/
│   │   │   └── AuthContext.jsx       ← globalny stan autoryzacji
│   │   ├── components/
│   │   │   ├── Layout.jsx            ← sidebar, nawigacja, dark mode toggle
│   │   │   ├── GlobalSearch.jsx      ← wyszukiwarka globalna
│   │   │   ├── NotificationBell.jsx  ← powiadomienia (polling co 60s)
│   │   │   ├── CollapsibleOrders.jsx ← zwijana lista zleceń z paginacją
│   │   │   ├── DamageMap.jsx         ← mapa uszkodzeń pojazdu (obraz + SVG overlay)
│   │   │   ├── NotesSection.jsx      ← notatki (klient/pojazd/zlecenie)
│   │   │   ├── OrderAssignments.jsx  ← przypisania pracowników
│   │   │   ├── Pagination.jsx        ← paginacja
│   │   │   ├── PaymentSection.jsx    ← płatności (gotówka/karta/faktura)
│   │   │   └── ClientStats.jsx       ← statystyki klienta
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── DashboardPage.jsx     ← różny widok wg roli, tygodniowy breakdown
│   │       ├── SchedulePage.jsx      ← harmonogram tygodniowy
│   │       ├── ReportsPage.jsx       ← raporty, wykresy, CSV (admin + manager)
│   │       ├── ServiceCatalogPage.jsx
│   │       ├── EmailsPage.jsx
│   │       ├── UsersPage.jsx         ← zarządzanie użytkownikami (admin)
│   │       ├── SettingsPage.jsx      ← ustawienia, 2FA, subskrypcja iCal
│   │       ├── LogsPage.jsx          ← logi systemowe (admin)
│   │       ├── InquiriesPage.jsx     ← zgłoszenia ze strony www (admin + manager)
│   │       ├── orders/
│   │       │   ├── OrdersPage.jsx          ← lista pogrupowana wg statusów + kanban
│   │       │   ├── OrderDetailPage.jsx
│   │       │   ├── OrderFormPage.jsx
│   │       │   └── OrderReceptionCard.jsx  ← karta przyjęcia pojazdu (PDF)
│   │       ├── clients/
│   │       │   ├── ClientsPage.jsx
│   │       │   └── ClientDetailPage.jsx
│   │       └── vehicles/
│   │           ├── VehiclesPage.jsx
│   │           └── VehicleDetailPage.jsx
│   ├── .env                          ← zmienne środowiskowe frontendu (nie commitować!)
│   └── package.json
└── website/                          ← strona wizytówkowa prestiq.pl
    ├── index.html                    ← strona główna (vanilla HTML)
    ├── style.css                     ← style (CSS variables, dark, responsive)
    └── script.js                     ← ES module: navbar, scroll reveal, formularz kontaktowy
```

---

## Uruchomienie

### Wymagania

- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
npm install
# Utwórz plik .env (patrz sekcja Konfiguracja)
npm run dev    # nodemon (development)
npm start      # node (production)
```

Backend startuje na `http://localhost:5000`.

> Przy każdym starcie serwer automatycznie wykonuje migrację — dodaje brakujące kolumny, tworzy nowe tabele i naprawia stare rekordy (operacje `IF NOT EXISTS`, bezpieczne dla istniejącej bazy).

### Frontend

```bash
cd frontend
npm install
npm run dev      # development
npm run build    # produkcja → dist/
```

Frontend startuje na `http://localhost:5173`.

### Dane testowe

Aby wypełnić bazę przykładowymi zleceniami (10/tydzień od stycznia):

```bash
cd backend
node seed_orders.js
```

> Uwaga: skrypt usuwa wszystkie istniejące zlecenia przed wstawieniem nowych.

---

## Konfiguracja

### Pliki konfiguracyjne

| Plik | Dotyczy | Opis |
|------|---------|------|
| `backend/src/config/appConfig.js` | Backend | Centralna konfiguracja — czyta z `.env`, definiuje wartości domyślne |
| `frontend/src/config.js` | Frontend | Centralna konfiguracja — czyta zmienne `VITE_*` z `.env` |
| `backend/.env` | Backend | Zmienne środowiskowe (hasła, klucze, porty) — **nie commitować!** |
| `frontend/.env` | Frontend | Zmienne środowiskowe Vite — **nie commitować!** |

### Backend — `backend/.env`

```env
# ─── Serwer ───────────────────────────────────────────────────────────────────
PORT=5000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
WEBSITE_URL=https://prestiq.pl          # strona wizytówkowa (CORS)

# ─── Baza danych ──────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autodetailing_crm
DB_USER=postgres
DB_PASSWORD=twoje_haslo

# ─── JWT / Bezpieczeństwo ─────────────────────────────────────────────────────
JWT_SECRET=losowy_dlugi_string_min_32_znaki
JWT_EXPIRY=8h
BCRYPT_ROUNDS=10

# ─── Email (Gmail) ────────────────────────────────────────────────────────────
EMAIL_SERVICE=gmail
EMAIL_USER=twoj@gmail.com
EMAIL_PASS=haslo_aplikacji_gmail   # App Password, nie hasło konta
EMAIL_FROM="Auto Detailing <twoj@gmail.com>"
```

> **Gmail App Password**: Konto Google → Bezpieczeństwo → Weryfikacja dwuetapowa → Hasła do aplikacji

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_COMPANY_NAME=Auto Detailing
```

> Zmienne Vite muszą mieć prefix `VITE_` — inaczej nie będą dostępne w przeglądarce.

### Wdrożenie produkcyjne

```env
# backend/.env
BACKEND_URL=https://crm.prestiq.pl
FRONTEND_URL=https://crm.prestiq.pl
WEBSITE_URL=https://prestiq.pl

# frontend/.env
VITE_API_URL=https://crm.prestiq.pl/api
```

---

## Schemat bazy danych

Wszystkie tabele tworzone są automatycznie przy starcie backendu (`IF NOT EXISTS`).

### Tabele główne

```sql
-- Użytkownicy CRM
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'employee',  -- 'admin' | 'manager' | 'employee'
  notification_prefs JSONB DEFAULT '{}',
  totp_secret VARCHAR(255),
  totp_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  nip VARCHAR(20),
  status VARCHAR(20) DEFAULT 'normal',  -- 'vip' | 'regular' | 'normal'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  brand VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  vin VARCHAR(50),
  plate_number VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  service_catalog_id INTEGER,
  service_name VARCHAR(255) NOT NULL,
  service_description TEXT,
  date_from TIMESTAMP,
  date_to TIMESTAMP,
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'inspection',
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_cash DECIMAL(10,2) DEFAULT 0,
  paid_card DECIMAL(10,2) DEFAULT 0,
  invoice_number VARCHAR(100),
  damage_map JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_assignments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(order_id, user_id)
);

CREATE TABLE order_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  changes JSONB NOT NULL DEFAULT '[]',
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE service_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50),  -- 'client' | 'vehicle' | 'order'
  entity_id INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  delay_days INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  email_type VARCHAR(50),
  recipient_email VARCHAR(255),
  subject VARCHAR(255),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Ustawienia firmy (jeden wiersz)
CREATE TABLE company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name VARCHAR(255) NOT NULL DEFAULT 'Auto Detailing',
  address TEXT DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email_contact VARCHAR(255) DEFAULT '',
  nip VARCHAR(20) DEFAULT '',
  website VARCHAR(255) DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Logi systemowe (audit trail)
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Zgłoszenia ze strony wizytówkowej
CREATE TABLE website_inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service VARCHAR(255),
  message TEXT,
  ip_address VARCHAR(45),
  status VARCHAR(30) DEFAULT 'new',  -- 'new' | 'contacted' | 'converted' | 'spam'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Pierwsze konto admina

```bash
# Wygeneruj hash hasła
node -e "require('bcryptjs').hash('twoje_haslo', 10).then(console.log)"
```

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@crm.pl', '$2b$10$...wklejony_hash...', 'Administrator', 'admin');
```

---

## Funkcje systemu

### Zlecenia
- Tworzenie, edycja, usuwanie, duplikowanie
- 6 statusów: `inspection` → `planned` → `in_progress` → `done` → `released` / `cancelled`
- Lista główna pogrupowana wg statusów (10 najwcześniejszych / grupę, paginacja)
- Widok Kanban z drag & drop między kolumnami
- Wybór usługi z katalogu lub własna nazwa
- Sekcja płatności: gotówka + karta + numer faktury
- Historia zmian (audit log)
- Masowa zmiana statusu (bulk) z checkboxami
- Eksport listy do CSV
- Notatki, przypisywanie pracowników
- Generowanie karty przyjęcia pojazdu (PDF)
- Automatyczne emaile przy tworzeniu i przy statusie `done`

### Klienci
- CRUD z historią zleceń i pojazdów
- Statystyki: łączna wartość, liczba wizyt, najczęstsza usługa, wykres miesięczny
- Statusy: `normal`, `regular`, `vip`
- Notatki

### Pojazdy
- CRUD przypisane do klienta
- Historia usług
- Mapa uszkodzeń (obraz PNG, 3 typy uszkodzeń z notatkami)
- Notatki

### Zgłoszenia ze strony www
- Formularz kontaktowy na `prestiq.pl` wysyła zgłoszenia do CRM przez publiczne API
- Rate limit: 3 zgłoszenia/godzinę/IP
- Honeypot antyspamowy (ukryte pole `website`)
- Panel w CRM (`/inquiries`) widoczny dla admin + manager:
  - Filtrowanie wg statusu (nowe / skontaktowano / skonwertowane / spam)
  - Zmiana statusu per zgłoszenie
  - Przycisk "Utwórz zlecenie" — automatycznie wypełnia formularz nowego zlecenia danymi z zgłoszenia
  - Usuwanie zgłoszeń

### Raporty (admin + manager)
- Przedziały: tydzień, miesiąc, poprzedni miesiąc, rok, własny zakres dat
- Przychód, liczba zleceń, wartość średnia — z deltą `↑/↓ X%` względem poprzedniego okresu
- Wykres dzienny przychodów
- Top 10 usług (liczba i wartość)
- Ranking pracowników — modal ze szczegółami (liczba zleceń, przychód, top usługi, statusy)
- Eksport do CSV

### Katalog usług (admin)
- Zarządzanie usługami (nazwa, opis, cena bazowa, kolejność)
- Aktywacja / deaktywacja
- 18 usług domyślnych wstawianych automatycznie przy pierwszym starcie

### Harmonogram
- Widok tygodniowy (pon–ndz), nawigacja między tygodniami
- Kolory wg statusu

### Dashboard
- Przychód miesiąca i tygodnia (admin + manager)
- Zlecenia na dziś / aktywne (filtrowane wg roli)
- Wykres przychodów 6 miesięcy (admin + manager)
- Tygodniowy breakdown (gotówka/karta/dzień)

### Powiadomienia
- Dzwonek z licznikiem, polling co 60s
- 4 kategorie: przeterminowane, na dziś, gotowe do wydania, jutro

### Wyszukiwarka globalna
- Klienci, pojazdy, zlecenia jednocześnie
- Filtrowanie po zakresie dat, debounce 300ms

### Kalendarz iCal
- Generowanie osobistego linku subskrypcji w Ustawieniach
- Działa z iPhone (Kalendarz), Google Calendar, Outlook
- Admin/manager widzi wszystkie zlecenia, pracownik tylko swoje

### Panel mailowy (admin + manager)
- Edycja szablonów HTML (admin)
- Historia wysłanych z paginacją
- Wysyłanie testowe per szablon (admin)
- Ręczne uruchamianie schedulera (admin)
- **Kampanie**: segmentacja klientów → podgląd listy → masowa wysyłka z własnym tematem i treścią HTML

### Logi systemowe (admin)
- Pełny audit trail akcji w systemie (tworzenie, edycja, usuwanie, logowanie, zmiany statusów)
- Filtrowanie po akcji, użytkowniku, typie encji, zakresie dat
- Paginacja

### Mapa uszkodzeń

Zakładka w każdym zleceniu — zaznaczanie uszkodzeń bezpośrednio na schemacie pojazdu.

**Jak działa:**
1. Otwórz zlecenie → sekcja **Mapa uszkodzeń**
2. Wybierz typ: **Zarysowanie** (pomarańczowy) / **Wgniecenie** (czerwony) / **Inne** (niebieski)
3. Kliknij w miejsce na schemacie — pojawi się numerowany marker
4. Wpisz notatkę pod uszkodzeniem (np. „głęboka rysa na masce")
5. Kliknij **Zapisz mapę**

**Wymiana schematu pojazdu:**
```
frontend/public/images/car-damage-map.png
```
PNG z przezroczystym tłem, dowolne proporcje.

**Format danych (`damage_map JSONB` w tabeli `orders`):**
```json
[
  { "id": 1735000000000, "x": 42.5, "y": 18.3, "type": "scratch", "note": "rysa na masce" },
  { "id": 1735000000001, "x": 78.1, "y": 61.4, "type": "dent",    "note": "wgniecenie zderzaka" }
]
```

### 2FA (TOTP)
- Konfiguracja przez QR code (Google Authenticator, Authy)
- Per-użytkownik, opcjonalne

---

## API — endpointy

Wszystkie endpointy wymagają nagłówka `Authorization: Bearer <token>` — z wyjątkiem `/api/auth/login`, `/api/health`, `/api/ical/:userId/:token` i **`/api/public/inquiries`**.

### Autentykacja
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/auth/login` | Logowanie (email + hasło + opcjonalnie TOTP) |

### Klienci
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/clients` | Lista (`?search=`) |
| POST | `/api/clients` | Nowy klient |
| GET | `/api/clients/:id` | Szczegóły + historia |
| PUT | `/api/clients/:id` | Edycja |
| DELETE | `/api/clients/:id` | Usuń |
| GET | `/api/clients/:id/stats` | Statystyki klienta |

### Pojazdy
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/vehicles` | Lista (`?search=`, `?client_id=`) |
| POST | `/api/vehicles` | Nowy pojazd |
| GET | `/api/vehicles/:id` | Szczegóły |
| PUT | `/api/vehicles/:id` | Edycja |
| DELETE | `/api/vehicles/:id` | Usuń |

### Zlecenia
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/orders` | Lista (`?search=`, `?date_from=`, `?date_to=`) |
| POST | `/api/orders` | Nowe zlecenie |
| GET | `/api/orders/:id` | Szczegóły |
| PUT | `/api/orders/:id` | Edycja |
| PUT | `/api/orders/:id/damage` | Zapisz mapę uszkodzeń |
| PATCH | `/api/orders/:id/status` | Zmiana statusu |
| DELETE | `/api/orders/:id` | Usuń (tylko admin) |
| GET | `/api/orders/:id/history` | Historia zmian (admin + manager) |
| GET | `/api/orders/export/csv` | Eksport CSV (admin) |

### Zgłoszenia ze strony www
| Metoda | Ścieżka | Dostęp | Opis |
|--------|---------|--------|------|
| POST | `/api/public/inquiries` | publiczny | Formularz ze strony (rate limit 3/h/IP) |
| GET | `/api/inquiries` | manager + admin | Lista zgłoszeń (`?status=`, `?page=`) |
| PATCH | `/api/inquiries/:id/status` | manager + admin | Zmiana statusu |
| DELETE | `/api/inquiries/:id` | manager + admin | Usuń zgłoszenie |

### Raporty
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/reports` | Statystyki (`?from=`, `?to=`) — admin + manager |
| GET | `/api/reports/employee/:userId` | Statystyki pracownika — admin + manager |

### Kampanie
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/campaigns/preview` | Podgląd listy (`?days_inactive=`, `?status=`, `?min_orders=`) |
| POST | `/api/campaigns/send` | Wyślij (`{ subject, body, client_ids }`) |

### Katalog usług
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/services` | Lista aktywnych |
| GET | `/api/services/all` | Wszystkie (admin) |
| POST | `/api/services` | Dodaj (admin) |
| PUT | `/api/services/:id` | Edycja (admin) |
| DELETE | `/api/services/:id` | Usuń (admin) |

### Przypisania pracowników
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/assignments/orders/:orderId` | Lista przypisanych |
| POST | `/api/assignments/orders/:orderId` | Przypisz pracownika |
| DELETE | `/api/assignments/orders/:orderId/users/:userId` | Usuń przypisanie |

### Notatki
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/notes/:entityType/:entityId` | Notatki |
| POST | `/api/notes/:entityType/:entityId` | Dodaj |
| DELETE | `/api/notes/:id` | Usuń |

### Użytkownicy (tylko admin)
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/users` | Lista |
| POST | `/api/users` | Nowy użytkownik |
| PUT | `/api/users/:id` | Edycja |
| DELETE | `/api/users/:id` | Usuń |

### Maile
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/emails/templates` | Lista szablonów — admin + manager |
| PUT | `/api/emails/templates/:id` | Edycja szablonu (admin) |
| GET | `/api/emails/logs` | Historia wysłanych — admin + manager |
| POST | `/api/emails/send/:orderId/:type` | Wyślij ręcznie (admin) |
| POST | `/api/emails/test` | Wyślij mail testowy (admin) |
| POST | `/api/emails/run-jobs` | Uruchom scheduler (admin) |

### Logi systemowe
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/logs` | Lista logów (`?action=`, `?user_id=`, `?entity_type=`, `?from=`, `?to=`, `?page=`) — tylko admin |

### Kalendarz iCal
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/ical/token` | Generuj URL subskrypcji (wymaga JWT) |
| GET | `/api/ical/:userId/:token` | Plik `.ics` (publiczny, bez JWT) |

### Pozostałe
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/search` | Globalna wyszukiwarka (`?q=`, `?date_from=`, `?date_to=`) |
| GET | `/api/dashboard` | Dane dashboardu (filtrowane wg roli) |
| GET | `/api/notifications` | Powiadomienia (filtrowane wg roli) |
| GET | `/api/settings` | Ustawienia firmy |
| PUT | `/api/settings` | Edycja ustawień (admin) |
| GET | `/api/pdf/orders/:id/reception` | PDF karty przyjęcia |
| POST | `/api/2fa/setup` | Generuj secret + QR |
| POST | `/api/2fa/enable` | Włącz 2FA |
| POST | `/api/2fa/disable` | Wyłącz 2FA |
| GET | `/api/2fa/status` | Status 2FA |
| GET | `/api/health` | Health check |

---

## Role użytkowników

| Uprawnienie | admin | manager | employee |
|---|:---:|:---:|:---:|
| Widzi wszystkie zlecenia | ✓ | ✓ | — (tylko przypisane) |
| Tworzy zlecenia | ✓ | ✓ | ✓ |
| Edytuje zlecenia | ✓ | ✓ | ✓ (tylko przypisane) |
| Usuwa zlecenia | ✓ | — | — |
| Duplikuje zlecenia | ✓ | ✓ | — |
| Historia zmian zlecenia | ✓ | ✓ | — |
| Eksport CSV | ✓ | — | — |
| Bulk zmiana statusu | ✓ | ✓ | — |
| Raporty i statystyki | ✓ | ✓ | — |
| Widzi przychody na dashboardzie | ✓ | ✓ | — |
| CRUD klientów/pojazdów | ✓ | ✓ | ✓ |
| Katalog usług | ✓ | ✓ (widok) | — |
| Historia zleceń klienta/pojazdu | ✓ | ✓ | — |
| Panel mailowy | ✓ | ✓ (widok) | — |
| Zarządzanie użytkownikami | ✓ | — | — |
| Zgłoszenia ze strony www | ✓ | ✓ | — |
| Logi systemowe | ✓ | — | — |
| Subskrypcja iCal | ✓ | ✓ | ✓ |

---

## Bezpieczeństwo

- **JWT** — tokeny 8h (konfigurowalne przez `JWT_EXPIRY`)
- **bcrypt** — hashowanie haseł (rounds: 10, konfigurowalne przez `BCRYPT_ROUNDS`)
- **2FA TOTP** — opcjonalne per użytkownik
- **Rate limiting** — login: 20 req/15min, API: 200 req/min, formularz www: 3 req/h/IP
- **Honeypot** — ukryte pole `website` w formularzu kontaktowym blokuje boty
- **Helmet** — bezpieczne nagłówki HTTP
- **CORS** — skonfigurowany na `FRONTEND_URL` + `WEBSITE_URL` + `www.prestiq.pl`
- **Parametryzowane zapytania SQL** — ochrona przed SQL injection
- **Walidacja inputu** — statusy, daty, ceny, formaty emaili, rozmiar body

### Plik .env

Upewnij się, że pliki `.env` są w `.gitignore`:

```
backend/.env
frontend/.env
.env
```

---

## Wdrożenie na VPS

### Struktura katalogów na serwerze

```
/var/www/crm/          ← repozytorium git (backend + frontend + website)
/var/www/prestiq/      ← pliki statyczne strony wizytówkowej (nginx)
```

### Skrypt deploy (`/var/www/crm/deploy.sh`)

```bash
#!/bin/bash
cd /var/www/crm
git pull
cd frontend && npm run build && cd ..
cp website/index.html /var/www/prestiq/
cp website/style.css  /var/www/prestiq/
cp website/script.js  /var/www/prestiq/
pm2 restart all
echo "Deploy gotowy!"
```

### Alias deploy

```bash
echo 'alias deploy="bash /var/www/crm/deploy.sh"' >> ~/.bashrc && source ~/.bashrc
```

Następnie wystarczy wpisać `deploy` żeby zaktualizować cały system.

### PM2

```bash
# Pierwsze uruchomienie backendu
cd /var/www/crm/backend
pm2 start src/index.js --name crm-backend
pm2 save
pm2 startup
```

### Ręczne utworzenie tabeli (jeśli migracja nie zadziałała)

```bash
psql -h localhost -U crmuser -d crmdb -c "
CREATE TABLE IF NOT EXISTS website_inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service VARCHAR(255),
  message TEXT,
  ip_address VARCHAR(45),
  status VARCHAR(30) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);"
```
