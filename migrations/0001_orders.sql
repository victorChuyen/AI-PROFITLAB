CREATE TABLE IF NOT EXISTS orders (
  code TEXT PRIMARY KEY,
  access_hash TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  account TEXT NOT NULL,
  bank TEXT NOT NULL,
  asset_key TEXT NOT NULL,
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  bump INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','review','refunded','cancelled')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  paid_at INTEGER,
  payment_id TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS payment_events (
  transaction_id TEXT PRIMARY KEY,
  order_code TEXT,
  amount INTEGER NOT NULL,
  account TEXT NOT NULL,
  gateway TEXT NOT NULL,
  transfer_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  outcome TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_order ON payment_events(order_code);
CREATE TABLE IF NOT EXISTS request_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
