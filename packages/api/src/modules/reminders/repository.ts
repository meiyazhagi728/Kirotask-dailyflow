import { db } from '../../db';
import type { Reminder, ReminderRow, CreateReminderDto, UpdateReminderDto } from './types';
import { randomUUID } from 'crypto';

/**
 * Maps a database row to a Reminder entity (camelCase).
 * @param row - The database row with snake_case fields.
 * @returns A Reminder entity with camelCase fields.
 */
function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    category: row.category,
    recurrence: row.recurrence,
    acknowledged: row.acknowledged === 1,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  };
}

/**
 * Creates a new reminder in the database.
 * @param dto - The create reminder data transfer object.
 * @returns The created Reminder entity.
 */
export function createReminder(dto: CreateReminderDto): Reminder {
  const id = randomUUID();
  const recurrence = dto.recurrence ?? 'none';
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO reminders (id, user_id, title, scheduled_at, category, recurrence, acknowledged, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
  ).run(id, dto.userId, dto.title, dto.scheduledAt, dto.category, recurrence, now);

  const row = db
    .prepare('SELECT * FROM reminders WHERE id = ?')
    .get(id) as ReminderRow;

  return rowToReminder(row);
}

/**
 * Retrieves all reminders for a user, ordered by scheduledAt ascending.
 * @param userId - The user ID.
 * @returns An array of Reminder entities.
 */
export function listReminders(userId: string): Reminder[] {
  const rows = db
    .prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY scheduled_at ASC')
    .all(userId) as ReminderRow[];

  return rows.map(rowToReminder);
}

/**
 * Retrieves a single reminder by ID.
 * @param reminderId - The reminder ID.
 * @returns The Reminder entity, or undefined if not found.
 */
export function getReminder(reminderId: string): Reminder | undefined {
  const row = db
    .prepare('SELECT * FROM reminders WHERE id = ?')
    .get(reminderId) as ReminderRow | undefined;

  return row ? rowToReminder(row) : undefined;
}

/**
 * Updates a reminder in the database.
 * @param reminderId - The reminder ID.
 * @param dto - The update reminder data transfer object.
 * @returns The updated Reminder entity, or undefined if not found.
 */
export function updateReminder(reminderId: string, dto: UpdateReminderDto): Reminder | undefined {
  const existing = getReminder(reminderId);
  if (!existing) return undefined;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (dto.title !== undefined) {
    updates.push('title = ?');
    values.push(dto.title);
  }
  if (dto.scheduledAt !== undefined) {
    updates.push('scheduled_at = ?');
    values.push(dto.scheduledAt);
  }
  if (dto.category !== undefined) {
    updates.push('category = ?');
    values.push(dto.category);
  }
  if (dto.recurrence !== undefined) {
    updates.push('recurrence = ?');
    values.push(dto.recurrence);
  }

  if (updates.length === 0) return existing;

  values.push(reminderId);
  db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return getReminder(reminderId);
}

/**
 * Deletes a reminder from the database.
 * @param reminderId - The reminder ID.
 * @returns true if a reminder was deleted, false if not found.
 */
export function deleteReminder(reminderId: string): boolean {
  const result = db
    .prepare('DELETE FROM reminders WHERE id = ?')
    .run(reminderId);

  return result.changes > 0;
}

/**
 * Acknowledges a reminder.
 * For recurring reminders, creates the next occurrence.
 * @param reminderId - The reminder ID.
 * @returns The acknowledged Reminder, or undefined if not found.
 */
export function acknowledgeReminder(reminderId: string): Reminder | undefined {
  const existing = getReminder(reminderId);
  if (!existing) return undefined;

  const now = new Date().toISOString();

  // Update the existing reminder
  db.prepare(
    `UPDATE reminders SET acknowledged = 1, acknowledged_at = ? WHERE id = ?`
  ).run(now, reminderId);

  // If recurring, create the next occurrence
  if (existing.recurrence !== 'none') {
    const scheduledAt = new Date(existing.scheduledAt);
    
    if (existing.recurrence === 'daily') {
      scheduledAt.setHours(scheduledAt.getHours() + 24);
    } else if (existing.recurrence === 'weekly') {
      scheduledAt.setHours(scheduledAt.getHours() + 24 * 7);
    }

    const newId = randomUUID();
    db.prepare(
      `INSERT INTO reminders (id, user_id, title, scheduled_at, category, recurrence, acknowledged, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
    ).run(newId, existing.userId, existing.title, scheduledAt.toISOString(), existing.category, existing.recurrence, now);
  }

  return getReminder(reminderId);
}

/**
 * Snoozes a reminder by advancing its scheduledAt by the specified minutes.
 * @param reminderId - The reminder ID.
 * @param minutes - Number of minutes to snooze (1-1440).
 * @returns The updated Reminder entity, or undefined if not found.
 */
export function snoozeReminder(reminderId: string, minutes: number): Reminder | undefined {
  const existing = getReminder(reminderId);
  if (!existing) return undefined;

  const scheduledAt = new Date(existing.scheduledAt);
  scheduledAt.setMinutes(scheduledAt.getMinutes() + minutes);

  db.prepare(
    `UPDATE reminders SET scheduled_at = ? WHERE id = ?`
  ).run(scheduledAt.toISOString(), reminderId);

  return getReminder(reminderId);
}
