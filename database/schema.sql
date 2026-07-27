-- ─── Suburbs (Gold Coast) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suburbs (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- ─── Agents (self-registered logins) ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  team TEXT,
  mobile_number TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safety net for users created before contact fields existed.
-- Runs on every startup, so the old "name" column is only touched
-- (migrated + dropped) once, the first time it's still present.
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    UPDATE users SET first_name = COALESCE(first_name, name) WHERE first_name IS NULL;
    ALTER TABLE users DROP COLUMN name;
  END IF;
END $$;
UPDATE users SET first_name = COALESCE(first_name, 'Unknown') WHERE first_name IS NULL;
UPDATE users SET last_name = COALESCE(last_name, '') WHERE last_name IS NULL;
UPDATE users SET mobile_number = COALESCE(mobile_number, 'Not provided') WHERE mobile_number IS NULL;
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN mobile_number SET NOT NULL;

-- ─── Off-market listings (sellers) ─────────────────────────────────
-- No address on purpose — suburb + price only, plus 3 more matching fields.
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suburb_id INTEGER NOT NULL REFERENCES suburbs(id),
  price NUMERIC(12, 0) NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse')),
  bedrooms SMALLINT NOT NULL,
  bathrooms SMALLINT NOT NULL,
  land_size TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Buyers ─────────────────────────────────────────────────────────
-- Same 5 fields as listings so they match directly: max price,
-- property type, min bedrooms, min bathrooms. Suburbs live in the
-- buyer_suburbs join table below (a buyer can pick up to 3).
CREATE TABLE IF NOT EXISTS buyers (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_price NUMERIC(12, 0) NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse')),
  min_bedrooms SMALLINT NOT NULL,
  min_bathrooms SMALLINT NOT NULL,
  land_size TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyer_suburbs (
  buyer_id INTEGER NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  suburb_id INTEGER NOT NULL REFERENCES suburbs(id),
  PRIMARY KEY (buyer_id, suburb_id)
);

-- Safety net for tables created before expiry/land-size/multi-suburb existed.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS land_size TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS land_size TEXT;
UPDATE listings SET expires_at = created_at + INTERVAL '30 days' WHERE expires_at IS NULL;
UPDATE buyers SET expires_at = created_at + INTERVAL '30 days' WHERE expires_at IS NULL;
ALTER TABLE listings ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE buyers ALTER COLUMN expires_at SET NOT NULL;

-- Migrate buyers off a single suburb_id onto the buyer_suburbs join table.
-- Runs on every startup, so buyers.suburb_id is only touched once, the
-- first time it's still present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buyers' AND column_name = 'suburb_id') THEN
    INSERT INTO buyer_suburbs (buyer_id, suburb_id)
      SELECT id, suburb_id FROM buyers WHERE suburb_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    ALTER TABLE buyers DROP COLUMN suburb_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_suburb ON listings(suburb_id);
CREATE INDEX IF NOT EXISTS idx_buyer_suburbs_suburb ON buyer_suburbs(suburb_id);
CREATE INDEX IF NOT EXISTS idx_buyer_suburbs_buyer ON buyer_suburbs(buyer_id);

-- Widen property types on tables created before this list existed.
UPDATE listings SET property_type = 'Apartment' WHERE property_type = 'Unit';
UPDATE buyers SET property_type = 'Apartment' WHERE property_type = 'Unit';
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_property_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_property_type_check
  CHECK (property_type IN ('House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse'));
ALTER TABLE buyers DROP CONSTRAINT IF EXISTS buyers_property_type_check;
ALTER TABLE buyers ADD CONSTRAINT buyers_property_type_check
  CHECK (property_type IN ('House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Waterfront', 'Penthouse'));

-- ─── Seed Gold Coast suburbs ────────────────────────────────────────
-- Placeholder list — replace/extend once the real list is provided.
INSERT INTO suburbs (name) VALUES
  ('Advancetown'), ('Alberton'), ('Arundel'), ('Ashmore'), ('Austinville'),
  ('Beechmont'), ('Benowa'), ('Biggera Waters'), ('Bilinga'), ('Bonogin'),
  ('Broadbeach'), ('Broadbeach Waters'), ('Bundall'), ('Burleigh Heads'), ('Burleigh Waters'),
  ('Carrara'), ('Clagiraba'), ('Coolangatta'), ('Coombabah'), ('Coomera'),
  ('Currumbin'), ('Currumbin Valley'), ('Currumbin Waters'), ('Elanora'), ('Gilston'),
  ('Guanaba'), ('Helensvale'), ('Highland Park'), ('Hollywell'), ('Hope Island'),
  ('Kirra'), ('Labrador'), ('Lower Beechmont'), ('Main Beach'), ('Maudsland'),
  ('Mermaid Beach'), ('Mermaid Waters'), ('Merrimac'), ('Miami'), ('Molendinar'),
  ('Mount Nathan'), ('Mudgeeraba'), ('Natural Bridge'), ('Nerang'), ('Numinbah Valley'),
  ('Ormeau'), ('Ormeau Hills'), ('Oxenford'), ('Pacific Pines'), ('Palm Beach'),
  ('Parkwood'), ('Pimpama'), ('Reedy Creek'), ('Robina'), ('Runaway Bay'),
  ('South Stradbroke'), ('Southport'), ('Springbrook'), ('Surfers Paradise'), ('Tallai'),
  ('Tallebudgera'), ('Tallebudgera Valley'), ('Tugun'), ('Upper Coomera'), ('Varsity Lakes'),
  ('Willow Vale'), ('Worongary'),
  ('Sorrento'), ('Isle of Capri'), ('Paradise Waters'), ('Benowa Waters'), ('Chevron Island')
ON CONFLICT (name) DO NOTHING;
