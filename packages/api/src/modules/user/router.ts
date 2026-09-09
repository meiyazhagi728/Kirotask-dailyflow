import { Router, Request, Response } from 'express';
import { getUser } from './service';
import type { ApiResponse } from '../../types/shared';
import type { User } from '../../types/shared';

export const userRouter = Router();

/**
 * GET /api/v1/user
 * Returns the single DailyFlow user.
 */
userRouter.get('/user', (_req: Request, res: Response): void => {
  const user = getUser();
  if (!user) {
    const payload: ApiResponse<null> = { data: null, error: 'User not found' };
    res.status(404).json(payload);
    return;
  }
  const payload: ApiResponse<User> = { data: user, error: null };
  res.status(200).json(payload);
});
