CREATE TABLE IF NOT EXISTS checkout_orders (
 id TEXT PRIMARY KEY, owner TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
 details TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'creating', transaction_id TEXT UNIQUE,
 payment TEXT, created_at INTEGER NOT NULL, checked_at INTEGER,
 UNIQUE(owner,request_key)
);
CREATE TABLE IF NOT EXISTS checkout_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS checkout_pending ON checkout_orders(state,created_at);