/**
 * Reminder recurrence enum.
 */
export type ReminderRecurrence = 'none' | 'daily' | 'weekly';

/**
 * Reminder category enum.
 */
export type ReminderCategory = 'work' | 'personal' | 'health';

/**
 * Reminder entity.
 */
export interface Reminder {
  id: string;
  userId: string;
  title: string;
  scheduledAt: string;
  category: ReminderCategory;
  recurrence: ReminderRecurrence;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

/**
 * DTO for creating a reminder.
 */
export interface CreateReminderDto {
  userId: string;
  title: string;
  scheduledAt: string;
  category: ReminderCategory;
  recurrence?: ReminderRecurrence;
}

/**
 * DTO for updating a reminder.
 */
export interface UpdateReminderDto {
  title?: string;
  scheduledAt?: string;
  category?: ReminderCategory;
  recurrence?: ReminderRecurrence;
}

/**
 * DTO for snoozing a reminder.
 */
export interface SnoozeDto {
  minutes: number;
}

/**
 * Reminder row from database.
 */
export interface ReminderRow {
  id: string;
  user_id: string;
  title: string;
  scheduled_at: string;
  category: ReminderCategory;
  recurrence: ReminderRecurrence;
  acknowledged: number;
  acknowledged_at: string | null;
  created_at: string;
}
