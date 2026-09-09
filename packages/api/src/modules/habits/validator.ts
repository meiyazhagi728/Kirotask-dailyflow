import { z } from 'zod';

export const createHabitSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  name: z.string().min(1, 'name is required').max(100, 'name must not exceed 100 characters'),
  description: z.string().max(500).optional(),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(100, 'name must not exceed 100 characters').optional(),
  description: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});
