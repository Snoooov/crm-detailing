const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.connect()
  .then(async (client) => {
    console.log('Połączono z bazą danych PostgreSQL');
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'employee';

        -- Usuń CHECK constraint na kolumnie role jeśli istnieje (blokuje wartość 'manager')
        DO $$
        BEGIN
          EXECUTE (
            SELECT 'ALTER TABLE users DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'users'::regclass AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%role%'
            LIMIT 1
          );
        EXCEPTION WHEN others THEN NULL;
        END $$;

        ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS damage_map JSONB DEFAULT '[]';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_catalog_id INTEGER;
        CREATE TABLE IF NOT EXISTS service_catalog (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          base_price DECIMAL(10,2),
          active BOOLEAN DEFAULT TRUE,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS order_history (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          user_name VARCHAR(255),
          changes JSONB NOT NULL DEFAULT '[]',
          changed_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);

        ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';

        CREATE TABLE IF NOT EXISTS company_settings (
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
        INSERT INTO company_settings (id, name) VALUES (1, 'Auto Detailing') ON CONFLICT (id) DO NOTHING;

        CREATE TABLE IF NOT EXISTS system_logs (
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
        CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
        CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON system_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
        CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON orders(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_orders_date_from ON orders(date_from);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_is_paid ON orders(is_paid);
        CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
        CREATE INDEX IF NOT EXISTS idx_order_assignments_user_id ON order_assignments(user_id);
        CREATE INDEX IF NOT EXISTS idx_order_assignments_order_id ON order_assignments(order_id);
        CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
        CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

        INSERT INTO service_catalog (name, description, base_price, sort_order)
        SELECT * FROM (VALUES
          ('Mycie zewnętrzne', 'Mycie karoserii, szyb, felg i opon. Usunięcie brudu i osadów drogowych.', 1.00, 10),
          ('Mycie + odkurzanie', 'Mycie zewnętrzne wraz z odkurzaniem wnętrza, wyczyszczeniem kokpitu i szyb od środka.', 1.00, 20),
          ('Detailing wnętrza', 'Gruntowne czyszczenie wnętrza: tapicerka, dywaniki, plastiki, szyby, uszczelki.', 1.00, 30),
          ('Pranie tapicerki', 'Pranie na mokro foteli i/lub podsufitki, czyszczenie szwów i trudnodostępnych miejsc.', 1.00, 40),
          ('Pranie wykładziny i dywaników', 'Głębokie pranie wykładziny podłogowej i dywaników ekstraktorką.', 1.00, 50),
          ('Korekta lakieru 1-stopniowa', 'Usunięcie drobnych rys i hologramów. Polerowanie maszyną rotacyjną lub DA.', 1.00, 60),
          ('Korekta lakieru 2-stopniowa', 'Usunięcie głębszych zarysowań i defektów lakieru. Pełna korekta przed powłoką.', 1.00, 70),
          ('Powłoka ceramiczna', 'Aplikacja powłoki ceramicznej chroniącej lakier przed zarysowaniami, UV i zabrudzeniami.', 1.00, 80),
          ('Powłoka ceramiczna na szyby', 'Aplikacja hydrofobowej powłoki ceramicznej na szyby czołowe i boczne.', 1.00, 90),
          ('Folia PPF — częściowa', 'Zabezpieczenie folią ochronną PPF wybranych elementów: maska, błotniki, zderzak.', 1.00, 100),
          ('Folia PPF — pełna', 'Pełne oklejenie karoserii folią ochronną PPF. Ochrona przed kamieniami i zarysowaniami.', 1.00, 110),
          ('Folia barwiona / przyciemnienie szyb', 'Aplikacja folii barwionej na szyby boczne i/lub tylną. Ochrona UV i prywatność.', 1.00, 120),
          ('Impregnacja tapicerki skórzanej', 'Czyszczenie, odżywienie i impregnacja skórzanej tapicerki preparatami pielęgnacyjnymi.', 1.00, 130),
          ('Ozonowanie wnętrza', 'Dezynfekcja i eliminacja nieprzyjemnych zapachów generatorem ozonu.', 1.00, 140),
          ('Renowacja reflektorów', 'Polerowanie i zabezpieczenie plastikowych kloszy reflektorów — przywrócenie przejrzystości.', 1.00, 150),
          ('Konserwacja felg', 'Czyszczenie, polerowanie i zabezpieczenie felg aluminiowych powłoką ochronną.', 1.00, 160),
          ('Mycie silnika', 'Czyszczenie komory silnika z tłuszczu, kurzu i osadów. Zabezpieczenie plastików.', 1.00, 170),
          ('Detailing kompleksowy (full detail)', 'Pełna usługa: korekta lakieru, szczegółowe czyszczenie wnętrza, powłoka ochronna.', 1.00, 180)
        ) AS v(name, description, base_price, sort_order)
        WHERE NOT EXISTS (SELECT 1 FROM service_catalog LIMIT 1);
      `);

      // Naprawa starych rekordów — mapowanie starych statusów na aktualne
      await client.query(`
        -- Stare angielskie nazwy statusów
        UPDATE orders SET status = 'planned'     WHERE status IN ('pending', 'scheduled', 'queued', 'accepted', 'new', 'open');
        UPDATE orders SET status = 'in_progress' WHERE status IN ('active', 'processing', 'started', 'working', 'in-progress');
        UPDATE orders SET status = 'done'        WHERE status IN ('completed', 'finished', 'ready');
        UPDATE orders SET status = 'released'    WHERE status IN ('closed', 'delivered', 'picked_up');
        UPDATE orders SET status = 'cancelled'   WHERE status IN ('canceled', 'rejected');

        -- Stare polskie nazwy statusów
        UPDATE orders SET status = 'planned'     WHERE status IN ('zaplanowane', 'oczekujace', 'przyjete', 'nowe');
        UPDATE orders SET status = 'in_progress' WHERE status IN ('w_trakcie', 'w trakcie', 'realizacja', 'w_realizacji');
        UPDATE orders SET status = 'done'        WHERE status IN ('gotowe', 'ukonczone', 'wykonane', 'zrealizowane');
        UPDATE orders SET status = 'released'    WHERE status IN ('wydane', 'odebrane', 'zamkniete');
        UPDATE orders SET status = 'cancelled'   WHERE status IN ('anulowane', 'odrzucone');

        -- Wszystko inne nieznane / NULL → inspection
        UPDATE orders SET status = 'inspection'
        WHERE status IS NULL
           OR status NOT IN ('inspection', 'planned', 'in_progress', 'done', 'released', 'cancelled');

        -- NULL date_from → fallback do created_at (żeby rekordy były widoczne w statystykach)
        UPDATE orders SET date_from = created_at WHERE date_from IS NULL;

        -- NULL date_to → fallback do date_from
        UPDATE orders SET date_to = date_from WHERE date_to IS NULL AND date_from IS NOT NULL;

        -- Usuń zlecenia bez żadnej nazwy usługi (nie pasują do żadnej usługi)
        DELETE FROM orders WHERE service_name IS NULL OR TRIM(service_name) = '';

        -- NULL wartości finansowe
        UPDATE orders SET price     = 0 WHERE price     IS NULL;
        UPDATE orders SET paid_cash = 0 WHERE paid_cash IS NULL;
        UPDATE orders SET paid_card = 0 WHERE paid_card IS NULL;

        -- Oznacz wszystkie istniejące zlecenia jako opłacone w całości gotówką
        UPDATE orders
        SET is_paid   = TRUE,
            paid_cash = COALESCE(price, 0),
            paid_card = 0
        WHERE is_paid = FALSE OR paid_cash = 0;
      `);

      console.log('Migracje wykonane');
    } catch (err) {
      console.error('Błąd migracji:', err.message);
    } finally {
      client.release();
    }
  })
  .catch(err => console.error('Błąd połączenia z bazą:', err));

module.exports = pool;