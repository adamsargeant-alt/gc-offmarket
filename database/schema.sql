-- ─── Suburbs (Gold Coast) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suburbs (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- ─── Agents (self-registered logins) ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Off-market listings (sellers) ─────────────────────────────────
-- No address on purpose — suburb + price only, plus 3 more matching fields.
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suburb_id INTEGER NOT NULL REFERENCES suburbs(id),
  price NUMERIC(12, 0) NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('House', 'Unit', 'Townhouse', 'Villa', 'Land')),
  bedrooms SMALLINT NOT NULL,
  bathrooms SMALLINT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Buyers ─────────────────────────────────────────────────────────
-- Same 5 fields as listings so they match directly: suburb, max price,
-- property type, min bedrooms, min bathrooms.
CREATE TABLE IF NOT EXISTS buyers (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suburb_id INTEGER NOT NULL REFERENCES suburbs(id),
  max_price NUMERIC(12, 0) NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('House', 'Unit', 'Townhouse', 'Villa', 'Land')),
  min_bedrooms SMALLINT NOT NULL,
  min_bathrooms SMALLINT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safety net for tables created before expiry support existed.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
UPDATE listings SET expires_at = created_at + INTERVAL '30 days' WHERE expires_at IS NULL;
UPDATE buyers SET expires_at = created_at + INTERVAL '30 days' WHERE expires_at IS NULL;
ALTER TABLE listings ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE buyers ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_suburb ON listings(suburb_id);
CREATE INDEX IF NOT EXISTS idx_buyers_suburb ON buyers(suburb_id);

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
