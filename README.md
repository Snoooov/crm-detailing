# Auto Detailing CRM

Webowa aplikacja CRM do zarządzania firmą auto detailingu. System umożliwia kompleksowe zarządzanie zleceniami, klientami, pojazdami oraz pracownikami. Zbudowana w architekturze klient-serwer z backendem Node.js i frontendem React.

---

## Spis treści

- [Funkcjonalności](#funkcjonalności)
- [Stack technologiczny](#stack-technologiczny)
- [Architektura projektu](#architektura-projektu)
- [Struktura folderów](#struktura-folderów)
- [Wymagania systemowe](#wymagania-systemowe)
- [Instalacja i konfiguracja](#instalacja-i-konfiguracja)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Schemat bazy danych](#schemat-bazy-danych)
- [API — dokumentacja endpointów](#api--dokumentacja-endpointów)
- [Autoryzacja i bezpieczeństwo](#autoryzacja-i-bezpieczeństwo)
- [Role użytkowników](#role-użytkowników)
- [Uruchamianie projektu](#uruchamianie-projektu)
- [Testowanie API](#testowanie-api)
- [Generowanie PDF](#generowanie-pdf)
- [Rozwiązywanie problemów](#rozwiązywanie-problemów)

---

## Funkcjonalności

### Zlecenia
- Lista zleceń z sortowaniem po każdej kolumnie
- Filtrowanie po statusie, zakresie dat, cenie i stanie płatności
- Wyszukiwarka pełnotekstowa (klient, pojazd, usługa)
- Zmiana statusu bezpośrednio z listy
- Szczegóły zlecenia z możliwością edycji
- Przypisywanie pracowników do zleceń
- Obsługa płatności (gotówka / karta / podział)
- Paginacja (20 rekordów na stronę)

### Statusy zleceń
| Status | Opis |
|--------|------|
| `inspection` | Oględziny / Wycena |
| `planned` | Zaplanowane |
| `in_progress` | W trakcie |
| `done` | Gotowe |
| `released` | Wydane |
| `cancelled` | Anulowane |

### Klienci
- Lista klientów podzielona na osoby prywatne i firmy (NIP)
- Wyszukiwarka po nazwie, telefonie, emailu
- Szczegóły klienta z historią zleceń i pojazdów
- Statystyki klienta (łączna wartość usług, liczba wizyt, najczęstsza usługa)
- Statusy klienta: VIP, Stały, Zwykły
- Notatki do klienta
- Paginacja (15 rekordów na stronę)

### Pojazdy
- Lista pojazdów z wyszukiwarką
- Powiązanie pojazdu z klientem
- Historia usług pojazdu
- Notatki do pojazdu
- Paginacja (20 rekordów na stronę)

### Dashboard
- Przychód bieżącego miesiąca
- Liczba zleceń na dziś
- Liczba aktywnych zleceń
- Wykres słupkowy przychodów z ostatnich 6 miesięcy
- Podział zleceń według statusów
- Lista nadchodzących zleceń

### Harmonogram tygodniowy
- Widok kalendarza tygodniowego (pon–niedz)
- Nawigacja między tygodniami (przód / wstecz / dziś)
- Zlecenia przypisane do dni
- Kliknięcie zlecenia otwiera jego szczegóły

### Karta przyjęcia pojazdu
- Generowanie PDF z danymi klienta i pojazdu
- Sekcje: dane klienta, dane pojazdu, zlecona usługa, poziom paliwa, wyposażenie, stan zewnętrzny, uwagi, zgoda, podpisy

### Powiadomienia
- Dzwonek w nawigacji z liczbą powiadomień
- Kategorie: przeterminowane, na dziś, gotowe do wydania, jutro
- Automatyczne odświeżanie co 60 sekund

### Globalna wyszukiwarka
- Wyszukiwanie jednocześnie w klientach, pojazdach i zleceniach
- Wyniki pogrupowane według kategorii
- Kliknięcie wyniku przenosi do szczegółów

### Użytkownicy
- Zarządzanie kontami pracowników (tylko admin)
- Role: Administrator, Pracownik
- Weryfikacja dwuetapowa (2FA) przez aplikację TOTP (Google Authenticator, Authy)
- Pracownik widzi tylko zlecenia do których jest przypisany

### Notatki
- Notatki do klientów, pojazdów i zleceń
- Data i godzina dodania notatki
- Usuwanie notatek

---

## Stack technologiczny

### Backend
- **Node.js** — środowisko uruchomieniowe
- **Express.js** — framework HTTP
- **PostgreSQL** — baza danych
- **pg** — klient PostgreSQL dla Node.js
- **bcryptjs** — hashowanie haseł
- **jsonwebtoken** — autoryzacja JWT
- **speakeasy** — kody TOTP (2FA)
- **qrcode** — generowanie kodów QR
- **puppeteer** — generowanie PDF
- **helmet** — nagłówki bezpieczeństwa HTTP
- **express-rate-limit** — ochrona przed brute force
- **cors** — obsługa CORS
- **dotenv** — zmienne środowiskowe

### Frontend
- **React** — biblioteka UI
- **Vite** — bundler i dev server
- **React Router DOM** — routing
- **Axios** — klient HTTP
- **React Hook Form** — obsługa formularzy

---

## Architektura projektu

```
Przeglądarka (React + Vite)
        ↕ HTTP/JSON (port 5173 dev)
Backend (Express.js, port 5000)
        ↕ SQL
PostgreSQL (port 5432)
```

Backend udostępnia REST API. Frontend komunikuje się z backendem przez Axios. Każdy request (poza logowaniem) wymaga tokenu JWT w nagłówku `Authorization: Bearer <token>`.

---

## Struktura folderów

```
autodetailing-crm/
├── backend/
│   ├── public/
│   │   └── images/
│   │       └── car-schema.jpg        # Schemat pojazdu do PDF
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Połączenie z PostgreSQL
│   │   ├── controllers/
│   │   │   ├── authController.js     # Logowanie, 2FA
│   │   │   ├── clientController.js   # CRUD klientów
│   │   │   ├── orderController.js    # CRUD zleceń
│   │   │   └── vehicleController.js  # CRUD pojazdów
│   │   ├── middleware/
│   │   │   └── auth.js               # Weryfikacja JWT, middleware adminOnly
│   │   ├── models/
│   │   │   ├── clientModel.js        # Zapytania SQL — klienci
│   │   │   ├── orderModel.js         # Zapytania SQL — zlecenia
│   │   │   └── vehicleModel.js       # Zapytania SQL — pojazdy
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # POST /api/auth/login
│   │   │   ├── assignmentRoutes.js   # Przypisania pracowników
│   │   │   ├── clientRoutes.js       # CRUD + statystyki klientów
│   │   │   ├── dashboardRoutes.js    # Statystyki dashboardu
│   │   │   ├── noteRoutes.js         # Notatki
│   │   │   ├── notificationRoutes.js # Powiadomienia
│   │   │   ├── orderRoutes.js        # CRUD zleceń
│   │   │   ├── pdfRoutes.js          # Generowanie PDF
│   │   │   ├── searchRoutes.js       # Globalna wyszukiwarka
│   │   │   ├── twoFactorRoutes.js    # Konfiguracja 2FA
│   │   │   ├── userRoutes.js         # Zarządzanie użytkownikami
│   │   │   └── vehicleRoutes.js      # CRUD pojazdów
│   │   ├── services/
│   │   │   └── pdfService.js         # Generowanie PDF przez Puppeteer
│   │   └── index.js                  # Główny plik serwera
│   ├── .env                          # Zmienne środowiskowe (nie commitować!)
│   ├── package.json
│   └── package-lock.json
│
└── frontend/
    ├── public/
    │   └── images/
    │       └── car-schema.jpg        # Schemat pojazdu (podgląd w przeglądarce)
    ├── src/
    │   ├── api/
    │   │   └── axios.js              # Konfiguracja Axios + interceptory JWT
    │   ├── components/
    │   │   ├── ClientStats.jsx       # Statystyki klienta
    │   │   ├── GlobalSearch.jsx      # Globalna wyszukiwarka
    │   │   ├── Layout.jsx            # Główny layout z nawigacją
    │   │   ├── NotesSection.jsx      # Sekcja notatek
    │   │   ├── NotificationBell.jsx  # Dzwonek powiadomień
    │   │   ├── OrderAssignments.jsx  # Przypisywanie pracowników
    │   │   ├── Pagination.jsx        # Komponent paginacji
    │   │   └── PaymentSection.jsx    # Sekcja płatności
    │   ├── context/
    │   │   └── AuthContext.jsx       # Globalny stan autoryzacji
    │   ├── pages/
    │   │   ├── clients/
    │   │   │   ├── ClientDetailPage.jsx
    │   │   │   └── ClientsPage.jsx
    │   │   ├── orders/
    │   │   │   ├── OrderDetailPage.jsx
    │   │   │   ├── OrderFormPage.jsx
    │   │   │   ├── OrderReceptionCard.jsx
    │   │   │   └── OrdersPage.jsx
    │   │   ├── vehicles/
    │   │   │   ├── VehicleDetailPage.jsx
    │   │   │   └── VehiclesPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── SchedulePage.jsx
    │   │   └── SettingsPage.jsx
    │   ├── App.jsx                   # Routing aplikacji
    │   ├── index.css                 # Globalne style
    │   └── main.jsx                  # Punkt wejścia React
    ├── package.json
    └── vite.config.js
```

---

## Wymagania systemowe

- **Node.js** v18 lub nowszy
- **npm** v9 lub nowszy
- **PostgreSQL** v14 lub nowszy
- **System operacyjny**: Windows 10/11, macOS, Linux

---

## Instalacja i konfiguracja

### 1. Klonowanie / pobranie projektu

```bash
cd Documents
# Jeśli używasz Git:
git clone <url-repozytorium> autodetailing-crm
cd autodetailing-crm

# Lub utwórz folder ręcznie i skopiuj pliki
```

### 2. Konfiguracja bazy danych

Otwórz pgAdmin 4 i wykonaj:

```sql
-- Utwórz bazę danych
CREATE DATABASE autodetailing_crm;

-- Przełącz się na nową bazę i wykonaj schemat
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    nip VARCHAR(20),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('vip', 'regular', 'normal')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    color VARCHAR(50),
    vin VARCHAR(17),
    plate_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    date_from DATE,
    date_to DATE,
    price DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'inspection' CHECK (status IN ('inspection', 'planned', 'in_progress', 'done', 'released', 'cancelled')),
    notes TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_cash DECIMAL(10,2) DEFAULT 0,
    paid_card DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_assignments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(order_id, user_id)
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('client', 'vehicle', 'order')),
    entity_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_assignments_order ON order_assignments(order_id);
CREATE INDEX idx_assignments_user ON order_assignments(user_id);
```

### 3. Tworzenie pierwszego administratora

```bash
cd backend
npm install

# Wygeneruj hash hasła
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"
```

Skopiuj wygenerowany hash i wykonaj w pgAdmin:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@crm.pl', 'WKLEJ_HASH_TUTAJ', 'Administrator', 'admin');
```

### 4. Instalacja zależności backendu

```bash
cd backend
npm install
```

### 5. Instalacja zależności frontendu

```bash
cd frontend
npm install
```

---

## Zmienne środowiskowe

Utwórz plik `backend/.env` (nigdy nie commituj tego pliku do repozytorium):

```env
# Serwer
PORT=5000

# Baza danych PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autodetailing_crm
DB_USER=postgres
DB_PASSWORD=twoje_haslo_postgres

# JWT — użyj długiego, losowego ciągu znaków
JWT_SECRET=superTajnyKluczJWT2024!zmienMnieNaProdukcji
```

> ⚠️ **WAŻNE**: Zmień `JWT_SECRET` na długi, losowy ciąg przed wdrożeniem produkcyjnym. Nigdy nie używaj domyślnych wartości na serwerze produkcyjnym.

---

## Schemat bazy danych

```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
├── role (admin | employee)
├── totp_secret
├── totp_enabled
└── created_at

clients
├── id (PK)
├── full_name
├── phone
├── email
├── nip (opcjonalnie — firmy)
├── status (vip | regular | normal)
└── created_at

vehicles
├── id (PK)
├── client_id (FK → clients)
├── brand
├── model
├── year
├── color
├── vin
├── plate_number
└── created_at

orders
├── id (PK)
├── client_id (FK → clients)
├── vehicle_id (FK → vehicles)
├── service_name
├── service_description
├── date_from
├── date_to
├── price
├── status (inspection | planned | in_progress | done | released | cancelled)
├── notes
├── is_paid
├── paid_cash
├── paid_card
└── created_at

order_assignments
├── id (PK)
├── order_id (FK → orders)
├── user_id (FK → users)
└── assigned_at

notes
├── id (PK)
├── entity_type (client | vehicle | order)
├── entity_id
├── content
└── created_at
```

**Relacje:**
- Klient → wiele pojazdów (1:N)
- Klient → wiele zleceń (1:N)
- Pojazd → wiele zleceń (1:N)
- Zlecenie → wielu pracowników przez `order_assignments` (N:M)
- Notatki → polimorficzne (klient / pojazd / zlecenie)

---

## API — dokumentacja endpointów

Wszystkie endpointy (poza `/api/auth/login` i `/api/health`) wymagają nagłówka:
```
Authorization: Bearer <token>
```

### Autoryzacja
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/login` | Logowanie, zwraca JWT token |

### Klienci
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/clients` | Lista klientów (`?search=`) |
| GET | `/api/clients/:id` | Szczegóły klienta z pojazdami i zleceniami |
| GET | `/api/clients/:id/stats` | Statystyki klienta |
| POST | `/api/clients` | Utwórz klienta |
| PUT | `/api/clients/:id` | Edytuj klienta |
| DELETE | `/api/clients/:id` | Usuń klienta |

### Pojazdy
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/vehicles` | Lista pojazdów (`?search=`, `?client_id=`) |
| GET | `/api/vehicles/:id` | Szczegóły pojazdu |
| POST | `/api/vehicles` | Utwórz pojazd |
| PUT | `/api/vehicles/:id` | Edytuj pojazd |
| DELETE | `/api/vehicles/:id` | Usuń pojazd |

### Zlecenia
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/orders` | Lista zleceń (`?search=`) |
| GET | `/api/orders/:id` | Szczegóły zlecenia |
| POST | `/api/orders` | Utwórz zlecenie (tylko admin) |
| PUT | `/api/orders/:id` | Edytuj zlecenie (tylko admin) |
| PATCH | `/api/orders/:id/status` | Zmień status zlecenia |
| DELETE | `/api/orders/:id` | Usuń zlecenie (tylko admin) |

### Przypisania pracowników
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/assignments/orders/:orderId` | Pobierz przypisanych pracowników |
| POST | `/api/assignments/orders/:orderId` | Przypisz pracownika (`{ user_id }`) |
| DELETE | `/api/assignments/orders/:orderId/users/:userId` | Usuń przypisanie |

### Notatki
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/notes/:entityType/:entityId` | Pobierz notatki (`client`, `vehicle`, `order`) |
| POST | `/api/notes/:entityType/:entityId` | Dodaj notatkę (`{ content }`) |
| DELETE | `/api/notes/:id` | Usuń notatkę |

### Dashboard
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/dashboard` | Statystyki dashboardu |

### Wyszukiwarka
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/search?q=` | Globalne wyszukiwanie (min. 2 znaki) |

### Powiadomienia
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/notifications` | Lista aktywnych powiadomień |

### PDF
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/pdf/orders/:id/reception` | Generuj kartę przyjęcia pojazdu (PDF) |

### Użytkownicy (tylko admin)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/users` | Lista użytkowników |
| POST | `/api/users` | Utwórz użytkownika |
| PUT | `/api/users/:id` | Edytuj użytkownika |
| DELETE | `/api/users/:id` | Usuń użytkownika |

### 2FA
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/2fa/status` | Status 2FA użytkownika |
| POST | `/api/2fa/setup` | Wygeneruj sekret i kod QR |
| POST | `/api/2fa/enable` | Włącz 2FA (`{ token }`) |
| POST | `/api/2fa/disable` | Wyłącz 2FA (`{ token }`) |

---

## Autoryzacja i bezpieczeństwo

### JWT
- Token ważny przez **8 godzin**
- Przechowywany w `localStorage`
- Automatycznie dołączany do każdego requestu przez interceptor Axios
- Przy wygaśnięciu (błąd 401) użytkownik jest automatycznie przekierowywany na stronę logowania

### Ochrona przed atakami
- **SQL Injection** — wszystkie zapytania używają parametryzowanych placeholderów (`$1, $2...`)
- **Brute force** — rate limiting: max 20 prób logowania / 15 minut, max 200 requestów API / minutę
- **XSS / nagłówki** — Helmet.js ustawia bezpieczne nagłówki HTTP
- **Hasła** — hashowane bcrypt z salt rounds = 10

### 2FA (TOTP)
Weryfikacja dwuetapowa przez aplikację authenticator (Google Authenticator, Authy):
1. Wejdź w **Ustawienia → Skonfiguruj 2FA**
2. Zeskanuj kod QR w aplikacji authenticator
3. Potwierdź kodem 6-cyfrowym
4. Przy każdym logowaniu po haśle wymagany jest kod TOTP

---

## Role użytkowników

### Administrator (`admin`)
- Widzi wszystkie zlecenia, klientów, pojazdy
- Tworzy, edytuje i usuwa zlecenia
- Zarządza użytkownikami (dodawanie, edycja, usuwanie)
- Przypisuje pracowników do zleceń
- Generuje karty przyjęcia PDF

### Pracownik (`employee`)
- Widzi **tylko zlecenia do których jest przypisany**
- Może zmieniać status przypisanych zleceń
- Nie może tworzyć, edytować ani usuwać zleceń
- Nie ma dostępu do zarządzania użytkownikami
- Ma dostęp do klientów i pojazdów (widok)

---

## Uruchamianie projektu

### Development

Otwórz **dwa osobne terminale**:

**Terminal 1 — Backend:**
```bash
cd autodetailing-crm/backend
npm run dev
```
Serwer uruchomi się na `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd autodetailing-crm/frontend
npm run dev
```
Aplikacja będzie dostępna na `http://localhost:5173`

### Produkcja

**Backend:**
```bash
cd backend
npm start
```

**Frontend (build):**
```bash
cd frontend
npm run build
# Pliki statyczne trafią do folderu dist/
# Serwuj je przez nginx lub inny serwer HTTP
```

### Domyślne dane logowania (development)
```
Email:  admin@crm.pl
Hasło:  admin123
```
> ⚠️ Zmień hasło przed wdrożeniem produkcyjnym!

---

## Testowanie API

### PowerShell (Windows)

```powershell
# Logowanie i pobranie tokenu
$response = Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@crm.pl","password":"admin123"}'
$token = ($response.Content | ConvertFrom-Json).token

# Test health check
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5000/api/health"

# Pobierz listę klientów
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:5000/api/clients" `
  -Headers @{Authorization="Bearer $token"}

# Dodaj klienta
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:5000/api/clients" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"full_name":"Jan Kowalski","phone":"500100200","status":"regular"}'

# Dodaj zlecenie
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:5000/api/orders" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"client_id":1,"vehicle_id":1,"service_name":"Detailing","price":500,"status":"inspection"}'

# Zmień status zlecenia
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:5000/api/orders/1/status" `
  -Method PATCH `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"status":"planned"}'
```

### curl (macOS / Linux)

```bash
# Logowanie
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.pl","password":"admin123"}' | jq -r '.token')

# Pobierz zlecenia
curl http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN"

# Wyszukiwarka
curl "http://localhost:5000/api/search?q=kowalski" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Generowanie PDF

Karta przyjęcia pojazdu generowana jest przez **Puppeteer** (headless Chromium).

### Wymagania
- Plik `backend/public/images/car-schema.jpg` musi istnieć (schemat pojazdu)
- Puppeteer pobiera Chromium podczas instalacji (`npm install`)

### Jak wygenerować kartę
1. Wejdź w szczegóły dowolnego zlecenia
2. Kliknij przycisk **Karta przyjęcia**
3. Na stronie podglądu kliknij **Generuj PDF**
4. PDF otworzy się w nowej karcie przeglądarki

### Rozwiązywanie problemów z PDF
Jeśli PDF się nie generuje sprawdź logi backendu — najczęstsze problemy:
- Brakujący plik `car-schema.jpg` w `backend/public/images/`
- Puppeteer nie zainstalowany — uruchom `npm install` w folderze `backend`
- Na serwerze Linux może być wymagane: `apt-get install -y chromium-browser`

---

## Rozwiązywanie problemów

### `psql --version` nie działa (Windows)
Dodaj PostgreSQL do PATH:
1. Otwórz **Zmienne środowiskowe systemu**
2. Edytuj zmienną **Path** w sekcji systemowej
3. Dodaj: `C:\Program Files\PostgreSQL\16\bin` (zmień numer wersji)
4. Zamknij i otwórz terminal ponownie

### `npm` nie działa w PowerShell
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Lub użyj **Command Prompt** zamiast PowerShell.

### Błąd połączenia z bazą danych
Sprawdź w pliku `.env`:
- Poprawne hasło (`DB_PASSWORD`)
- PostgreSQL działa — sprawdź w pgAdmin lub Services
- Baza `autodetailing_crm` istnieje

### Biały ekran / błędy 401 po restarcie
Token JWT wygasł. Wejdź na `http://localhost:5173/login` i zaloguj się ponownie.

### CORS błędy
Upewnij się że w `backend/src/index.js` CORS jest skonfigurowany przed Helmet:
```javascript
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
```

### Puppeteer nie generuje PDF na Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser fonts-liberation libappindicator3-1

# macOS — Puppeteer pobiera własne Chromium, powinno działać bez dodatkowych kroków
```

### Port już zajęty
```bash
# Windows — znajdź i zakończ proces na porcie 5000
netstat -ano | findstr :5000
taskkill /PID <numer_pid> /F

# macOS/Linux
lsof -ti:5000 | xargs kill
```

---

## Dobre praktyki

- Nie commituj pliku `.env` do repozytorium — dodaj go do `.gitignore`
- Regularnie twórz kopię zapasową bazy danych (`pg_dump autodetailing_crm > backup.sql`)
- Zmieniaj `JWT_SECRET` na produkcji na długi, losowy ciąg
- Używaj HTTPS na produkcji
- Włącz 2FA na koncie administratora

---

## Licencja

Projekt stworzony na potrzeby wewnętrzne firmy Auto Detailing. Wszelkie prawa zastrzeżone.