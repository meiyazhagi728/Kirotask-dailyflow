import { z } from 'zod';

/**
 * Schema for creating a task.
 */
export const createTaskSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  title: z.string().min(1, 'title is required'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'priority must be one of: low, medium, high' }),
  }),
  category: z.enum(['work', 'personal', 'health'], {
    errorMap: () => ({ message: 'category must be one of: work, personal, health' }),
  }),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  dueDate: z.string().optional(),
});

/**
 * Schema for updating a task.
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'title is required').optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum(['work', 'personal', 'health']).optional(),
  dueDate: z.string().nullable().optional(),
});
