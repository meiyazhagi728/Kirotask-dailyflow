import { Router, Request, Response } from 'express';
import * as service from './service';
import { createReminderSchema, updateReminderSchema, snoozeSchema } from './validator';
import type { ApiResponse } from '../../types/shared';
import type { Reminder } from './types';

export const remindersRouter = Router();

/**
 * POST /api/v1/reminders
 * Creates a new reminder.
 */
remindersRouter.post('/reminders', (req: Request, res: Response): void => {
  try {
    const parsed = createReminderSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const reminder = service.createReminder(parsed.data);
    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(201).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * GET /api/v1/reminders?userId=...
 * Lists all reminders for a user.
 */
remindersRouter.get('/reminders', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      const payload: ApiResponse<null> = { data: null, error: 'userId query param is required' };
      res.status(400).json(payload);
      return;
    }

    const reminders = service.listReminders(userId);
    const payload: ApiResponse<Reminder[]> = { data: reminders, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * PATCH /api/v1/reminders/:id
 * Updates a reminder.
 */
remindersRouter.patch('/reminders/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const parsed = updateReminderSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const reminder = service.updateReminder(id, parsed.data);
    if (!reminder) {
      const payload: ApiResponse<null> = { data: null, error: 'Reminder not found' };
      res.status(404).json(payload);
      return;
    }

    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * DELETE /api/v1/reminders/:id
 * Deletes a reminder.
 */
remindersRouter.delete('/reminders/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const deleted = service.deleteReminder(id);
    if (!deleted) {
      const payload: ApiResponse<null> = { data: null, error: 'Reminder not found' };
      res.status(404).json(payload);
      return;
    }

    const payload: ApiResponse<null> = { data: null, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * POST /api/v1/reminders/:id/acknowledge
 * Acknowledges a reminder and creates recurrence if applicable.
 */
remindersRouter.post('/reminders/:id/acknowledge', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const reminder = service.acknowledgeReminder(id);
    if (!reminder) {
      const payload: ApiResponse<null> = { data: null, error: 'Reminder not found' };
      res.status(404).json(payload);
      return;
    }

    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Reminder already acknowledged') {
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(409).json(payload);
      return;
    }
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * POST /api/v1/reminders/:id/snooze
 * Snoozes a reminder by the specified number of minutes.
 */
remindersRouter.post('/reminders/:id/snooze', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const parsed = snoozeSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const reminder = service.snoozeReminder(id, parsed.data.minutes);
    if (!reminder) {
      const payload: ApiResponse<null> = { data: null, error: 'Reminder not found' };
      res.status(404).json(payload);
      return;
    }

    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Cannot snooze an acknowledged reminder') {
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(409).json(payload);
      return;
    }
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});
