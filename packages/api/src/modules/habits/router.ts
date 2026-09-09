import { Router, Request, Response } from 'express';
import * as service from './service';
import { createHabitSchema, updateHabitSchema } from './validator';
import type { ApiResponse } from '../../types/shared';
import type { Habit, HeatmapDay } from './types';

export const habitsRouter = Router();

/**
 * POST /api/v1/habits
 * Creates a new habit.
 */
habitsRouter.post('/habits', (req: Request, res: Response): void => {
  try {
    const parsed = createHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const { userId, name, description } = parsed.data;
    const habit = service.createHabit(userId, name, description);
    const payload: ApiResponse<Habit> = { data: habit, error: null };
    res.status(201).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * GET /api/v1/habits?userId=...
 * Lists all habits for a user.
 */
habitsRouter.get('/habits', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      const payload: ApiResponse<null> = { data: null, error: 'userId query param is required' };
      res.status(400).json(payload);
      return;
    }

    const habits = service.listHabits(userId);
    const payload: ApiResponse<Habit[]> = { data: habits, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * PATCH /api/v1/habits/:id
 * Updates a habit.
 */
habitsRouter.patch('/habits/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const parsed = updateHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const habit = service.updateHabit(id, parsed.data);
    if (!habit) {
      const payload: ApiResponse<null> = { data: null, error: 'Habit not found' };
      res.status(404).json(payload);
      return;
    }

    const payload: ApiResponse<Habit> = { data: habit, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * DELETE /api/v1/habits/:id
 * Deletes a habit.
 */
habitsRouter.delete('/habits/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const deleted = service.deleteHabit(id);
    if (!deleted) {
      const payload: ApiResponse<null> = { data: null, error: 'Habit not found' };
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
 * POST /api/v1/habits/:id/completions
 * Logs a completion for a habit.
 */
habitsRouter.post('/habits/:id/completions', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      const payload: ApiResponse<null> = { data: null, error: 'userId query param is required' };
      res.status(400).json(payload);
      return;
    }

    const completion = service.logCompletion(id, userId);
    const payload: ApiResponse<{ id: string }> = { data: { id: completion.id }, error: null };
    res.status(201).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes('already exists')) {
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(409).json(payload);
      return;
    }
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * GET /api/v1/habits/:id/streak?utcOffset=...
 * Gets the streak for a habit.
 */
habitsRouter.get('/habits/:id/streak', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const utcOffset = parseInt(req.query.utcOffset as string, 10) || 0;

    const habit = service.getHabit(id);
    if (!habit) {
      const payload: ApiResponse<null> = { data: null, error: 'Habit not found' };
      res.status(404).json(payload);
      return;
    }

    const streak = service.computeHabitStreak(id, utcOffset);
    const payload: ApiResponse<{ streak: number }> = { data: { streak }, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * GET /api/v1/habits/:id/heatmap
 * Gets heatmap data for a habit.
 */
habitsRouter.get('/habits/:id/heatmap', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const habit = service.getHabit(id);
    if (!habit) {
      const payload: ApiResponse<null> = { data: null, error: 'Habit not found' };
      res.status(404).json(payload);
      return;
    }

    const heatmap = service.getHeatmapData(id);
    const payload: ApiResponse<HeatmapDay[]> = { data: heatmap, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});
