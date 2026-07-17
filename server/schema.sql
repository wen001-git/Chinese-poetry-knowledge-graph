-- server/schema.sql
-- PoemGraph · Neon Postgres schema (separate from WhiteBoard tables via `poemgraph.` prefix)

CREATE TABLE IF NOT EXISTS poemgraph.accounts (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  username_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_devices SMALLINT NOT NULL DEFAULT 3 CHECK (max_devices BETWEEN 1 AND 20),
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS poemgraph.devices (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES poemgraph.accounts(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, device_id)
);

CREATE INDEX IF NOT EXISTS poemgraph_devices_account_id_idx ON poemgraph.devices(account_id);
