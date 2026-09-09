import { apiFetch } from './client';

export interface ScoreResult {
  value: number;
  task_completion_rate: number;
  reminder_ack_rate: number;
  habit_streak_consistency: number;
}

export const scoreApi = {
  get: () => apiFetch<ScoreResult>('/score'),
};
