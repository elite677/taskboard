CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boards (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_members (
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role     TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS lists (
  id       SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title    TEXT NOT NULL,
  position DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id          SERIAL PRIMARY KEY,
  list_id     INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date    DATE,
  position    DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_user ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_board  ON lists(board_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_list   ON cards(list_id, position);
