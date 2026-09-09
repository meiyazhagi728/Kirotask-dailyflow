import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as service from './service';
import { createTaskSchema, updateTaskSchema } from './validator';
import type { ApiResponse } from '../../types/shared';
import type { Task } from './types';

export const tasksRouter = Router();

/**
 * POST /api/v1/tasks
 * Creates a new task.
 */
tasksRouter.post('/tasks', (req: Request, res: Response): void => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const task = service.createTask(parsed.data);
    const payload: ApiResponse<Task> = { data: task, error: null };
    res.status(201).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * GET /api/v1/tasks?userId=...
 * Lists all tasks for a user.
 */
tasksRouter.get('/tasks', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      const payload: ApiResponse<null> = { data: null, error: 'userId query param is required' };
      res.status(400).json(payload);
      return;
    }

    const tasks = service.listTasks(userId);
    const payload: ApiResponse<Task[]> = { data: tasks, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * PATCH /api/v1/tasks/:id
 * Updates a task.
 */
tasksRouter.patch('/tasks/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid request';
      const payload: ApiResponse<null> = { data: null, error: message };
      res.status(400).json(payload);
      return;
    }

    const task = service.updateTask(id, parsed.data);
    if (!task) {
      const payload: ApiResponse<null> = { data: null, error: 'Task not found' };
      res.status(404).json(payload);
      return;
    }

    const payload: ApiResponse<Task> = { data: task, error: null };
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const payload: ApiResponse<null> = { data: null, error: message };
    res.status(500).json(payload);
  }
});

/**
 * DELETE /api/v1/tasks/:id
 * Deletes a task.
 */
tasksRouter.delete('/tasks/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const deleted = service.deleteTask(id);
    if (!deleted) {
      const payload: ApiResponse<null> = { data: null, error: 'Task not found' };
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
