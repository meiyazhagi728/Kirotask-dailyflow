import { db } from '../../db';
import type { User } from '../../types/shared';

/**
 * Stable UUID v4 identity for the single DailyFlow user.
 * Generated once at module load time; upsertUser() writes this into the DB on first run.
 */
export const DEFAULT_USER_ID: string = crypto.randomUUID();

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

/**
 * Returns the single application user, or undefined when the users table is empty.
 */
export function getUser(): User | undefined {
  const row = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(DEFAULT_USER_ID) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

/**
 * Ensures the default user row exists.
 * Inserts on first startup; subsequent calls are no-ops.
 */
export function upsertUser(): User {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM users')
    .get() as { count: number };

  if (count === 0) {
    db.prepare(
      'INSERT INTO users (id, email, name) VALUES (?, ?, ?)'
    ).run(DEFAULT_USER_ID, 'user@dailyflow.local', 'DailyFlow User');
  }

  return getUser()!;
}
