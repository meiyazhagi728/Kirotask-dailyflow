import * as repo from './repository';
import { computeStreak } from './streakUtils';
import type { Habit, HabitCompletion, HeatmapDay } from './types';

/**
 * Creates a new habit.
 * @param userId - The user ID.
 * @param name - The habit name.
 * @param description - Optional description.
 * @returns The created Habit.
 */
export function createHabit(userId: string, name: string, description?: string): Habit {
  return repo.createHabit(userId, name, description);
}

/**
 * Lists all habits for a user.
 * @param userId - The user ID.
 * @returns Array of habits.
 */
export function listHabits(userId: string): Habit[] {
  return repo.listHabits(userId);
}

/**
 * Gets a habit by ID.
 * @param habitId - The habit ID.
 * @returns The habit or undefined.
 */
export function getHabit(habitId: string): Habit | undefined {
  return repo.getHabit(habitId);
}

/**
 * Updates a habit.
 * @param habitId - The habit ID.
 * @param updates - Fields to update.
 * @returns Updated habit or undefined.
 */
export function updateHabit(habitId: string, updates: { name?: string; description?: string | null; active?: boolean }): Habit | undefined {
  return repo.updateHabit(habitId, updates);
}

/**
 * Deletes a habit.
 * @param habitId - The habit ID.
 * @returns true if deleted.
 */
export function deleteHabit(habitId: string): boolean {
  return repo.deleteHabit(habitId);
}

/**
 * Logs a completion for a habit.
 * @param habitId - The habit ID.
 * @param userId - The user ID.
 * @returns The created completion.
 */
export function logCompletion(habitId: string, userId: string): HabitCompletion {
  return repo.logCompletion(habitId, userId);
}

/**
 * Computes the streak for a habit.
 * @param habitId - The habit ID.
 * @param utcOffset - UTC offset in minutes.
 * @returns The streak value.
 */
export function computeHabitStreak(habitId: string, utcOffset: number): number {
  const completions = repo.getCompletions(habitId);
  const dates = completions.map(c => new Date(c.completedAt));
  return computeStreak(dates);
}

/**
 * Gets heatmap data for a habit.
 * @param habitId - The habit ID.
 * @returns Array of 365 HeatmapDay objects.
 */
export function getHeatmapData(habitId: string): HeatmapDay[] {
  return repo.getHeatmapData(habitId);
}
