import { z } from 'zod';

/**
 * Schema for creating a reminder.
 */
export const createReminderSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  title: z.string().min(1, 'title is required').max(200, 'title must not exceed 200 characters'),
  scheduledAt: z.string().min(1, 'scheduledAt is required'),
  category: z.enum(['work', 'personal', 'health'], {
    errorMap: () => ({ message: 'category must be one of: work, personal, health' }),
  }),
  recurrence: z.enum(['none', 'daily', 'weekly']).optional(),
});

/**
 * Schema for updating a reminder.
 */
export const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  scheduledAt: z.string().min(1).optional(),
  category: z.enum(['work', 'personal', 'health']).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']).optional(),
});

/**
 * Schema for snoozing a reminder.
 */
export const snoozeSchema = z.object({
  minutes: z.number().int().min(1, 'minutes must be between 1 and 1440').max(1440, 'minutes must be between 1 and 1440'),
});
