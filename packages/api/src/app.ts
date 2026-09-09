import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { exportRouter } from './modules/export/router';
import { userRouter } from './modules/user/router';
import { tasksRouter } from './modules/tasks/router';
import { remindersRouter } from './modules/reminders/router';
import { habitsRouter } from './modules/habits/router';
import { ApiResponse } from './types/shared';

// TODO: Uncomment when score module is implemented
// import { scoreRouter } from './modules/score/router';

/**
 * Creates and configures the Express application.
 * @returns Configured Express application instance
 */
export function createApp(): Application {
  const app = express();

  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  // Request timeout middleware (10 s)
  app.use((_req: Request, res: Response, next: NextFunction): void => {
    res.setTimeout(10000, () => {
      const payload: ApiResponse<null> = { data: null, error: 'Request timeout' };
      res.status(503).json(payload);
    });
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response): void => {
    const payload: ApiResponse<{ status: string; timestamp: string }> = {
      data: { status: 'ok', timestamp: new Date().toISOString() },
      error: null,
    };
    res.json(payload);
  });

  // Module routers
  app.use('/api/v1', userRouter);
  app.use('/api/v1', exportRouter);
  app.use('/api/v1', tasksRouter);
  app.use('/api/v1', remindersRouter);
  app.use('/api/v1', habitsRouter);
  // app.use('/api/v1', scoreRouter);

  // 404 handler
  app.use((_req: Request, res: Response): void => {
    const payload: ApiResponse<null> = { data: null, error: 'Route not found' };
    res.status(404).json(payload);
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error(err.stack);
    const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
    res.status(500).json(payload);
  });

  return app;
}
