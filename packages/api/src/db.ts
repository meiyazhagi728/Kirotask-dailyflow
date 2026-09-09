import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'db.sqlite');

mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title        TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'todo'
                   CHECK(status IN ('todo', 'in_progress', 'done')),
      priority     TEXT NOT NULL
                   CHECK(priority IN ('low', 'medium', 'high')),
      category     TEXT NOT NULL
                   CHECK(category IN ('work', 'personal', 'health')),
      due_date     TEXT,
      completed_at TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      scheduled_at    TEXT NOT NULL,
      category        TEXT NOT NULL
                      CHECK(category IN ('work', 'personal', 'health')),
      recurrence      TEXT NOT NULL DEFAULT 'none'
                      CHECK(recurrence IN ('none', 'daily', 'weekly')),
      acknowledged    INTEGER NOT NULL DEFAULT 0,
      acknowledged_at TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id           TEXT PRIMARY KEY,
      habit_id     TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      completed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_id
      ON tasks(user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_reminders_user_id
      ON reminders(user_id, scheduled_at ASC);

    CREATE INDEX IF NOT EXISTS idx_habits_user_id
      ON habits(user_id);

    CREATE INDEX IF NOT EXISTS idx_completions_habit
      ON habit_completions(habit_id, completed_at DESC);

    /*
     * SQLite does not allow expressions inside a table-level
     * UNIQUE constraint, so the daily uniqueness rule is
     * implemented as a unique expression index instead.
     */
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_habit_completion_day
      ON habit_completions(
        habit_id,
        substr(completed_at, 1, 10)
      );
  `);
}

initDb();