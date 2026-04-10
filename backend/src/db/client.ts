import Database from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from './schema';

// ── Connection ──────────────────────────────────────────────

const DB_PATH = import.meta.dir.replace(/\/src\/db$/, '/0xrip.db');

export const sqlite = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent read performance.
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

// ── Auto-create tables on first run ─────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS graves (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    epitaph       TEXT NOT NULL,
    date          TEXT NOT NULL,
    position_x    REAL NOT NULL DEFAULT 0,
    position_y    REAL NOT NULL DEFAULT 5,
    position_z    REAL NOT NULL DEFAULT 0,
    video_task_id TEXT,
    video_url     TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    grave_id   TEXT NOT NULL REFERENCES graves(id),
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at   INTEGER
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id          TEXT PRIMARY KEY,
    grave_id    TEXT NOT NULL REFERENCES graves(id),
    session_id  TEXT REFERENCES sessions(id),
    content     TEXT NOT NULL,
    source_type TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// ── Re-export query helpers for convenience ─────────────────

export { eq, and, isNull };
