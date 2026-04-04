# Auto Detailing CRM

System zarządzania warsztatem auto detailingu — zlecenia, klienci, pojazdy, pracownicy, katalog usług, maile automatyczne, raporty, kalendarz iCal.

---

## Spis treści

1. [Technologie](#technologie)
2. [Struktura projektu](#struktura-projektu)
3. [Uruchomienie](#uruchomienie)
4. [Zmienne środowiskowe](#zmienne-środowiskowe)
5. [Schemat bazy danych](#schemat-bazy-danych)
6. [Funkcje systemu](#funkcje-systemu)
7. [API — endpointy](#api--endpointy)
8. [Role użytkowników](#role-użytkowników)
9. [Bezpieczeństwo](#bezpieczeństwo)

---

## Technologie

| Warstwa | Stack |
|---|---|
| Backend | Node.js 18+, Express, PostgreSQL (`pg`), JWT |
| Autentykacja | bcryptjs, jsonwebtoken, speakeasy (TOTP 2FA), qrcode |
| Email | nodemailer (Gmail), node-cron |
| PDF | puppeteer |
| Bezpieczeństwo | helmet, express-rate-limit, cors |
| Frontend | React 19, Vite, React Router, axios |

---

## Struktura projektu

```
autodetailing-crm/
├── backend/
│   ├── src/
│   │   ├── index.js                  ← entry point, Express + rejestracja tras
│   │   ├── config/
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
│   │   │   └── twoFactorRoutes.js
│   │   └── services/
│   │       ├── emailService.js       ← wysyłanie emaili, szablony HTML, logi
│   │       ├── emailScheduler.js     ← cron co godzinę, automatyczne maile
│   │       └── pdfService.js         ← generowanie PDF (puppeteer)
│   ├── seed_orders.js                ← skrypt do generowania zleceń testowych
│   ├── .env                          ← zmienne środowiskowe (nie commitować!)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                   ← routing aplikacji
    │   ├── index.css                 ← globalne style, CSS variables, dark mode
    │   ├── api/
    │   │   └── axios.js              ← konfiguracja axios, interceptory JWT
    │   ├── constants/
    │   │   └── orderStatuses.js      ← współdzielone etykiety i kolory statusów
    │   ├── hooks/
    │   │   └── useDarkMode.js        ← MutationObserver na body.dark
    │   ├── context/
    │   │   └── AuthContext.jsx       ← globalny stan autoryzacji
    │   ├── components/
    │   │   ├── Layout.jsx            ← sidebar, nawigacja, dark mode toggle
    │   │   ├── GlobalSearch.jsx      ← wyszukiwarka globalna
    │   │   ├── NotificationBell.jsx  ← powiadomienia (polling co 60s)
    │   │   ├── CollapsibleOrders.jsx ← zwijana lista zleceń z paginacją
    │   │   ├── NotesSection.jsx      ← notatki (klient/pojazd/zlecenie)
    │   │   ├── OrderAssignments.jsx  ← przypisania pracowników
    │   │   ├── Pagination.jsx        ← paginacja
    │   │   ├── PaymentSection.jsx    ← płatności (gotówka/karta/faktura)
    │   │   └── ClientStats.jsx       ← statystyki klienta
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── DashboardPage.jsx     ← różny widok wg roli, tygodniowy breakdown
    │       ├── SchedulePage.jsx      ← harmonogram tygodniowy
    │       ├── ReportsPage.jsx       ← raporty, wykresy, CSV (admin + manager)
    │       ├── ServiceCatalogPage.jsx
    │       ├── EmailsPage.jsx
    │       ├── UsersPage.jsx         ← zarządzanie użytkownikami (admin)
    │       ├── SettingsPage.jsx      ← ustawienia, 2FA, subskrypcja iCal
    │       ├── orders/
    │       │   ├── OrdersPage.jsx          ← lista pogrupowana wg statusów + kanban
    │       │   ├── OrderDetailPage.jsx
    │       │   ├── OrderFormPage.jsx
    │       │   └── OrderReceptionCard.jsx  ← karta przyjęcia pojazdu (PDF)
    │       ├── clients/
    │       │   ├── ClientsPage.jsx
    │       │   └── ClientDetailPage.jsx
    │       └── vehicles/
    │           ├── VehiclesPage.jsx
    │           └── VehicleDetailPage.jsx
    └── package.json
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
# Utwórz plik .env (patrz sekcja niżej)
# Utwórz bazę danych: createdb autodetailing_crm
npm run dev    # nodemon (development)
npm start      # node (production)
```

Backend startuje na `http://localhost:5000`.

> Przy każdym starcie serwer automatycznie wykonuje migrację — dodaje brakujące kolumny, tworzy nowe tabele i naprawia stare rekordy (operacje `IF NOT EXISTS`, bezpieczne dla istniejącej bazy).

### Frontend

```bash
cd frontend
npm install
npm run dev
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

## Zmienne środowiskowe

Utwórz plik `backend/.env`:

```env
PORT=5000

# Baza danych
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autodetailing_crm
DB_USER=postgres
DB_PASSWORD=twoje_haslo

# JWT
JWT_SECRET=losowy_dlugi_string_min_32_znaki

# Email (Gmail)
EMAIL_USER=twoj@gmail.com
EMAIL_PASS=haslo_aplikacji_gmail   # App Password, nie hasło konta
EMAIL_FROM="Auto Detailing <twoj@gmail.com>"

# CORS
FRONTEND_URL=http://localhost:5173

# URL backendu — używany do generowania linków iCal
# Zostaw puste lub localhost → system użyje automatycznie wykrytego lokalnego IP sieci
# Na produkcji ustaw pełny URL: https://crm.twojadomena.pl
BACKEND_URL=http://localhost:5000
```

> **Gmail App Password**: Konto Google → Bezpieczeństwo → Weryfikacja dwuetapowa → Hasła do aplikacji

---

## Schemat bazy danych

### Tabele tworzone ręcznie (przy pierwszym uruchomieniu)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',  -- 'admin' | 'manager' | 'employee'
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
  status VARCHAR(50) DEFAULT 'normal',  -- 'vip' | 'regular' | 'normal'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  brand VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(100),
  vin VARCHAR(50),
  plate_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  service_catalog_id INTEGER REFERENCES service_catalog(id) ON DELETE SET NULL,
  service_name VARCHAR(255) NOT NULL,
  service_description TEXT,
  date_from DATE,
  date_to DATE,
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'inspection',
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_cash DECIMAL(10,2) DEFAULT 0,
  paid_card DECIMAL(10,2) DEFAULT 0,
  invoice_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_assignments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
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
  entity_type VARCHAR(50) NOT NULL,  -- 'client' | 'vehicle' | 'order'
  entity_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255),
  subject VARCHAR(500),
  body TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  delay_days INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  client_id INTEGER REFERENCES clients(id),
  email_type VARCHAR(100),
  recipient_email VARCHAR(255),
  subject VARCHAR(500),
  status VARCHAR(50),  -- 'sent' | 'error' | 'disabled'
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Indeksy
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_vehicle_id ON orders(vehicle_id);
CREATE INDEX idx_orders_date_from ON orders(date_from);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_is_paid ON orders(is_paid);
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_order_assignments_user_id ON order_assignments(user_id);
CREATE INDEX idx_order_assignments_order_id ON order_assignments(order_id);
CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
CREATE INDEX idx_order_history_order ON order_history(order_id);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
```

### Dane startowe — szablony emaili

```sql
INSERT INTO email_templates (type, name, subject, body, enabled, delay_days) VALUES
  ('confirmation', 'Potwierdzenie rezerwacji',
   'Potwierdzenie przyjęcia pojazdu — {{service_name}}',
   '<p>Dzień dobry {{client_name}},</p><p>Potwierdzamy przyjęcie pojazdu {{vehicle_brand}} {{vehicle_model}} ({{plate_number}}) na usługę: <strong>{{service_name}}</strong>.</p><p>Termin: {{date_from}}</p><p>Dziękujemy za zaufanie!</p>',
   true, 0),
  ('ready', 'Pojazd gotowy do odbioru',
   'Twój pojazd jest gotowy — {{service_name}}',
   '<p>Dzień dobry {{client_name}},</p><p>Informujemy, że Twój pojazd {{vehicle_brand}} {{vehicle_model}} jest gotowy do odbioru.</p><p>Zapraszamy!</p>',
   true, 0),
  ('reminder_24h', 'Przypomnienie o wizycie',
   'Przypomnienie — jutro wizyta w Auto Detailing',
   '<p>Dzień dobry {{client_name}},</p><p>Przypominamy o jutrzejszej wizycie: <strong>{{service_name}}</strong>.</p><p>Do zobaczenia!</p>',
   true, 0),
  ('followup_short', 'Follow-up krótki (4 dni)',
   'Jak oceniasz naszą usługę?',
   '<p>Dzień dobry {{client_name}},</p><p>Minęło kilka dni od wykonania usługi {{service_name}}. Będziemy wdzięczni za opinię!</p>',
   true, 4),
  ('followup_long', 'Follow-up długi (30 dni)',
   'Czas na kolejny detailing?',
   '<p>Dzień dobry {{client_name}},</p><p>Minął miesiąc od ostatniej wizyty. Zapraszamy ponownie!</p>',
   true, 30);
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
- Widok Kanban z drag & drop między kolumnami (też paginacja 10/kolumnę)
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
- Notatki

### Raporty (admin + manager)
- Przedziały: tydzień, miesiąc, poprzedni miesiąc, rok, własny zakres dat
- Przychód, liczba zleceń, wartość średnia, podział gotówka/karta
- Wykres dzienny przychodów
- Top 10 usług (liczba i wartość)
- Ranking pracowników
- Eksport do CSV

### Katalog usług (admin)
- Zarządzanie usługami (nazwa, opis, cena bazowa, kolejność)
- Aktywacja / deaktywacja

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
- Backend automatycznie wykrywa lokalny IP sieci (iPhone na tym samym WiFi może subskrybować bez konfiguracji)
- Na produkcji: ustaw `BACKEND_URL` w `.env`

### Panel mailowy (admin)
- Edycja szablonów HTML
- Historia wysłanych z paginacją
- Wysyłanie testowe per szablon
- Ręczne uruchamianie schedulera

### 2FA (TOTP)
- Konfiguracja przez QR code (Google Authenticator, Authy)
- Per-użytkownik, opcjonalne

---

## API — endpointy

Wszystkie endpointy wymagają nagłówka `Authorization: Bearer <token>` (oprócz `/api/auth/login`, `/api/health` i `/api/ical/:userId/:token`).

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
| DELETE | `/api/clients/:id` | Usuń (blokada gdy ma zlecenia) |
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
| PATCH | `/api/orders/:id/status` | Zmiana statusu |
| DELETE | `/api/orders/:id` | Usuń (tylko admin) |
| GET | `/api/orders/:id/history` | Historia zmian (admin + manager) |
| GET | `/api/orders/export/csv` | Eksport CSV (admin) |

### Raporty
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/reports` | Statystyki (`?from=`, `?to=`) — admin + manager |

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

### Maile (tylko admin)
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/emails/templates` | Lista szablonów |
| PUT | `/api/emails/templates/:id` | Edycja szablonu |
| GET | `/api/emails/logs` | Historia wysłanych |
| POST | `/api/emails/send/:orderId/:type` | Wyślij ręcznie |
| POST | `/api/emails/test` | Wyślij mail testowy |
| POST | `/api/emails/run-jobs` | Uruchom scheduler |

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
| Subskrypcja iCal | ✓ | ✓ | ✓ |

---

## Bezpieczeństwo

- **JWT** — tokeny 8h; wygaśnięcie pokazuje komunikat zamiast cichego przekierowania
- **bcrypt** — hashowanie haseł (rounds: 10)
- **2FA TOTP** — opcjonalne per użytkownik
- **Rate limiting** — login: 20 req/15min, API: 200 req/min
- **Helmet** — bezpieczne nagłówki HTTP
- **CORS** — skonfigurowany na `FRONTEND_URL`
- **Parametryzowane zapytania SQL** — ochrona przed SQL injection
- **Walidacja inputu** — statusy, daty, ceny, formaty emaili, rozmiar body

### Plik .env

Upewnij się, że `.env` jest w `.gitignore`:

```
backend/.env
.env
```
