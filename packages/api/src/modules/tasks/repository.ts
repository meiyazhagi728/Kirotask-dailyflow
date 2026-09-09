import { db } from '../../db';
import type { Task, TaskRow, CreateTaskDto, UpdateTaskDto } from './types';
import { randomUUID } from 'crypto';

/**
 * Maps a database row to a Task entity.
 */
function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    category: row.category,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

/**
 * Creates a new task.
 */
export function createTask(dto: CreateTaskDto): Task {
  const id = randomUUID();
  const status = dto.status ?? 'todo';

  // ISO timestamp includes milliseconds, which gives better ordering.
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO tasks (
      id,
      user_id,
      title,
      status,
      priority,
      category,
      due_date,
      completed_at,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    dto.userId,
    dto.title,
    status,
    dto.priority,
    dto.category,
    dto.dueDate ?? null,
    status === 'done' ? now : null,
    now
  );

  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(id) as TaskRow;

  return rowToTask(row);
}

/**
 * Retrieves all tasks for a user.
 *
 * rowid is used as a tie-breaker when multiple tasks have
 * the same created_at timestamp.
 */
export function listTasks(userId: string): Task[] {
  const rows = db
    .prepare(
      `SELECT *
       FROM tasks
       WHERE user_id = ?
       ORDER BY created_at DESC, rowid DESC`
    )
    .all(userId) as TaskRow[];

  return rows.map(rowToTask);
}

/**
 * Retrieves a single task by ID.
 */
export function getTask(taskId: string): Task | undefined {
  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(taskId) as TaskRow | undefined;

  return row ? rowToTask(row) : undefined;
}

/**
 * Updates a task.
 *
 * completedAt lifecycle:
 * - When changing to "done", completedAt is set.
 * - When changing away from "done", completedAt is cleared.
 * - When updating other fields, completedAt is preserved.
 */
export function updateTask(
  taskId: string,
  dto: UpdateTaskDto
): Task | undefined {
  const existing = getTask(taskId);

  if (!existing) {
    return undefined;
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (dto.title !== undefined) {
    updates.push('title = ?');
    values.push(dto.title);
  }

  if (dto.status !== undefined) {
    updates.push('status = ?');
    values.push(dto.status);

    if (dto.status === 'done') {
      // If it is already done, preserve the original completion time.
      // Otherwise, set a new completion time.
      const completedAt =
        existing.status === 'done' && existing.completedAt
          ? existing.completedAt
          : new Date().toISOString();

      updates.push('completed_at = ?');
      values.push(completedAt);
    } else {
      // Any status other than done clears completedAt.
      updates.push('completed_at = ?');
      values.push(null);
    }
  }

  if (dto.priority !== undefined) {
    updates.push('priority = ?');
    values.push(dto.priority);
  }

  if (dto.category !== undefined) {
    updates.push('category = ?');
    values.push(dto.category);
  }

  if (dto.dueDate !== undefined) {
    updates.push('due_date = ?');
    values.push(dto.dueDate);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(taskId);

  db.prepare(
    `UPDATE tasks
     SET ${updates.join(', ')}
     WHERE id = ?`
  ).run(...values);

  return getTask(taskId);
}

/**
 * Deletes a task.
 */
export function deleteTask(taskId: string): boolean {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ?')
    .run(taskId);

  return result.changes > 0;
}