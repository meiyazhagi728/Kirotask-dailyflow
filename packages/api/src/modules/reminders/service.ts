import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
} from './types';

import * as repo from './repository';

/**
 * Creates a new reminder.
 * @param dto - The create reminder DTO.
 * @returns The created reminder.
 */
export function createReminder(dto: CreateReminderDto): Reminder {
  return repo.createReminder(dto);
}

/**
 * Lists all reminders for a user.
 * @param userId - The user ID.
 * @returns An array of reminders ordered by scheduledAt ascending.
 */
export function listReminders(userId: string): Reminder[] {
  return repo.listReminders(userId);
}

/**
 * Gets a reminder by ID.
 * @param reminderId - The reminder ID.
 * @returns The reminder, or undefined if not found.
 */
export function getReminder(reminderId: string): Reminder | undefined {
  return repo.getReminder(reminderId);
}

/**
 * Updates a reminder by ID.
 * @param reminderId - The reminder ID.
 * @param dto - The update reminder DTO.
 * @returns The updated reminder, or undefined if not found.
 */
export function updateReminder(
  reminderId: string,
  dto: UpdateReminderDto,
): Reminder | undefined {
  return repo.updateReminder(reminderId, dto);
}

/**
 * Deletes a reminder by ID.
 * @param reminderId - The reminder ID.
 * @returns true if deleted, false if not found.
 */
export function deleteReminder(reminderId: string): boolean {
  return repo.deleteReminder(reminderId);
}

/**
 * Acknowledges a reminder.
 * Creates a new reminder for recurring reminders.
 * @param reminderId - The reminder ID.
 * @returns The acknowledged reminder.
 * @throws Error if reminder is not found or already acknowledged.
 */
export function acknowledgeReminder(reminderId: string): Reminder {
  const existing = repo.getReminder(reminderId);

  if (!existing) {
    throw new Error('Reminder not found');
  }

  if (existing.acknowledged) {
    throw new Error('Reminder already acknowledged');
  }

  const reminder = repo.acknowledgeReminder(reminderId);

  if (!reminder) {
    throw new Error('Reminder not found');
  }

  return reminder;
}

/**
 * Snoozes a reminder by the specified number of minutes.
 * @param reminderId - The reminder ID.
 * @param minutes - Minutes to snooze (1-1440).
 * @returns The updated reminder.
 * @throws Error if reminder is not found or already acknowledged.
 */
export function snoozeReminder(
  reminderId: string,
  minutes: number,
): Reminder {
  const existing = repo.getReminder(reminderId);

  if (!existing) {
    throw new Error('Reminder not found');
  }

  if (existing.acknowledged) {
    throw new Error('Cannot snooze an acknowledged reminder');
  }

  const reminder = repo.snoozeReminder(reminderId, minutes);

  if (!reminder) {
    throw new Error('Reminder not found');
  }

  return reminder;
}