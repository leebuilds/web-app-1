import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "polls.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    allow_multiple INTEGER NOT NULL DEFAULT 0,
    results_visibility TEXT NOT NULL DEFAULT 'after_vote',
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    voter_token TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_options_poll ON poll_options(poll_id);
  CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);
  CREATE INDEX IF NOT EXISTS idx_votes_token ON votes(poll_id, voter_token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

// Short, human-friendly share codes. Alphabet avoids ambiguous chars (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generatePollCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Migrate existing databases: add polls.owner_id if it doesn't exist yet.
const pollColumns = db.prepare(`PRAGMA table_info(polls)`).all();
if (!pollColumns.some((c) => c.name === "owner_id")) {
  db.exec(`ALTER TABLE polls ADD COLUMN owner_id TEXT`);
}
db.exec(`CREATE INDEX IF NOT EXISTS idx_polls_owner ON polls(owner_id)`);

// Migrate existing databases: add polls.code and backfill existing rows.
if (!pollColumns.some((c) => c.name === "code")) {
  db.exec(`ALTER TABLE polls ADD COLUMN code TEXT`);
}
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_polls_code ON polls(code)`);

const pollsWithoutCode = db
  .prepare(`SELECT id FROM polls WHERE code IS NULL`)
  .all();
if (pollsWithoutCode.length > 0) {
  const setCode = db.prepare(`UPDATE polls SET code = ? WHERE id = ?`);
  const codeExists = db.prepare(`SELECT 1 FROM polls WHERE code = ?`);
  for (const { id } of pollsWithoutCode) {
    let code;
    do {
      code = generatePollCode();
    } while (codeExists.get(code));
    setCode.run(code, id);
  }
}

export default db;
