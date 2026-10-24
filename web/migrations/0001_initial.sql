-- Orders live in Stripe (see src/lib/orders.ts); D1 only holds subscribers.
CREATE TABLE subscribers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,               -- stored lowercased
  source          TEXT NOT NULL CHECK (source IN ('site', 'checkout')),
  consented_at    TEXT NOT NULL,                      -- ISO 8601 UTC
  unsubscribed_at TEXT                                -- ISO 8601 UTC
);
