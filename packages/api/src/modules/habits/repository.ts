import { db } from '../../db';
import type { Habit, HabitCompletion, HeatmapDay } from './types';
import { randomUUID } from 'crypto';

interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  active: number;
  created_at: string;
}

interface HabitCompletionRow {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function rowToHabitCompletion(
  row: HabitCompletionRow
): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    userId: row.user_id,
    completedAt: row.completed_at,
  };
}

/**
 * Creates a new habit.
 */
export function createHabit(
  userId: string,
  name: string,
  description?: string
): Habit {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO habits (
        id,
        user_id,
        name,
        description,
        active,
        created_at
      )
      VALUES (?, ?, ?, ?, 1, ?)
    `
  ).run(
    id,
    userId,
    name,
    description ?? null,
    now
  );

  const row = db
    .prepare('SELECT * FROM habits WHERE id = ?')
    .get(id) as HabitRow;

  return rowToHabit(row);
}

/**
 * Lists all habits for a user.
 */
export function listHabits(userId: string): Habit[] {
  const rows = db
    .prepare(
      `
        SELECT *
        FROM habits
        WHERE user_id = ?
        ORDER BY created_at DESC
      `
    )
    .all(userId) as HabitRow[];

  return rows.map(rowToHabit);
}

/**
 * Gets a habit by ID.
 */
export function getHabit(
  habitId: string
): Habit | undefined {
  const row = db
    .prepare(
      `
        SELECT *
        FROM habits
        WHERE id = ?
      `
    )
    .get(habitId) as HabitRow | undefined;

  return row ? rowToHabit(row) : undefined;
}

/**
 * Updates a habit.
 */
export function updateHabit(
  habitId: string,
  updates: {
    name?: string;
    description?: string | null;
    active?: boolean;
  }
): Habit | undefined {
  const existing = getHabit(habitId);

  if (!existing) {
    return undefined;
  }

  const clauses: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    clauses.push('name = ?');
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    clauses.push('description = ?');
    values.push(updates.description);
  }

  if (updates.active !== undefined) {
    clauses.push('active = ?');
    values.push(updates.active ? 1 : 0);
  }

  if (clauses.length === 0) {
    return existing;
  }

  values.push(habitId);

  db.prepare(
    `UPDATE habits SET ${clauses.join(', ')} WHERE id = ?`
  ).run(...values);

  return getHabit(habitId);
}

/**
 * Deletes a habit.
 */
export function deleteHabit(habitId: string): boolean {
  const result = db
    .prepare('DELETE FROM habits WHERE id = ?')
    .run(habitId);

  return result.changes > 0;
}

/**
 * Logs a habit completion.
 *
 * A habit can only be completed once per UTC calendar day.
 */
export function logCompletion(
  habitId: string,
  userId: string
): HabitCompletion {
  const completedAt = new Date().toISOString();
  const today = completedAt.slice(0, 10);
  const id = randomUUID();

  /*
   * Check first so the expected error message is returned.
   */
  const existing = db
    .prepare(
      `
        SELECT id
        FROM habit_completions
        WHERE habit_id = ?
          AND substr(completed_at, 1, 10) = ?
        LIMIT 1
      `
    )
    .get(habitId, today) as
    | { id: string }
    | undefined;

  if (existing) {
    throw new Error(
      'Completion already exists for this habit today'
    );
  }

  try {
    db.prepare(
      `
        INSERT INTO habit_completions (
          id,
          habit_id,
          user_id,
          completed_at
        )
        VALUES (?, ?, ?, ?)
      `
    ).run(
      id,
      habitId,
      userId,
      completedAt
    );
  } catch (err: unknown) {
    /*
     * The unique expression index protects against two
     * simultaneous requests completing the same habit.
     */
    const message =
      err instanceof Error ? err.message : '';

    if (
      message.includes('UNIQUE constraint failed') ||
      message.includes(
        'idx_unique_habit_completion_day'
      )
    ) {
      throw new Error(
        'Completion already exists for this habit today'
      );
    }

    throw err;
  }

  const row = db
    .prepare(
      `
        SELECT *
        FROM habit_completions
        WHERE id = ?
      `
    )
    .get(id) as HabitCompletionRow;

  return rowToHabitCompletion(row);
}

/**
 * Gets all completions for a habit.
 */
export function getCompletions(
  habitId: string
): HabitCompletion[] {
  const rows = db
    .prepare(
      `
        SELECT *
        FROM habit_completions
        WHERE habit_id = ?
        ORDER BY completed_at DESC
      `
    )
    .all(habitId) as HabitCompletionRow[];

  return rows.map(rowToHabitCompletion);
}

/**
 * Gets 365 days of heatmap data.
 */
export function getHeatmapData(
  habitId: string
): HeatmapDay[] {
  const today = new Date();
  const result: HeatmapDay[] = [];

  const rows = db
    .prepare(
      `
        SELECT completed_at
        FROM habit_completions
        WHERE habit_id = ?
      `
    )
    .all(habitId) as { completed_at: string }[];

  const dateCount = new Map<string, number>();

  for (const row of rows) {
    const date = row.completed_at.slice(0, 10);

    dateCount.set(
      date,
      (dateCount.get(date) ?? 0) + 1
    );
  }

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(
      date.getDate() - i
    );

    const dateStr = date
      .toISOString()
      .slice(0, 10);

    result.push({
      date: dateStr,
      count: dateCount.get(dateStr) ?? 0,
    });
  }

  return result;
}