import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import * as repo from './repository';

const testUserId = 'test-user-id';

beforeEach(() => {
  db.exec('DELETE FROM habit_completions');
  db.exec('DELETE FROM habits');
  db.exec('DELETE FROM users');

  db.prepare(
    `INSERT INTO users (id, email, name)
     VALUES (?, ?, ?)`
  ).run(testUserId, 'test@example.com', 'Test User');
});

describe('Habit Repository', () => {
  describe('createHabit', () => {
    it('creates a habit with required fields', () => {
      const habit = repo.createHabit(testUserId, 'Morning run');

      expect(habit.id).toBeDefined();
      expect(habit.userId).toBe(testUserId);
      expect(habit.name).toBe('Morning run');
      expect(habit.description).toBeNull();
      expect(habit.active).toBe(true);
      expect(habit.createdAt).toBeDefined();
    });

    it('creates a habit with description', () => {
      const habit = repo.createHabit(
        testUserId,
        'Read',
        '30 minutes daily'
      );

      expect(habit.description).toBe('30 minutes daily');
    });
  });

  describe('listHabits', () => {
    it('returns empty array when no habits exist', () => {
      const habits = repo.listHabits(testUserId);

      expect(habits).toEqual([]);
    });

    it('returns all habits for a user', () => {
      repo.createHabit(testUserId, 'Habit 1');
      repo.createHabit(testUserId, 'Habit 2');

      const habits = repo.listHabits(testUserId);

      expect(habits).toHaveLength(2);
    });
  });

  describe('updateHabit', () => {
    it('updates habit name', () => {
      const habit = repo.createHabit(testUserId, 'Original');

      const updated = repo.updateHabit(habit.id, {
        name: 'Updated',
      });

      expect(updated?.name).toBe('Updated');
    });

    it('sets active to false', () => {
      const habit = repo.createHabit(testUserId, 'Test');

      const updated = repo.updateHabit(habit.id, {
        active: false,
      });

      expect(updated?.active).toBe(false);
    });
  });

  describe('deleteHabit', () => {
    it('deletes an existing habit', () => {
      const habit = repo.createHabit(testUserId, 'Test');

      const deleted = repo.deleteHabit(habit.id);

      expect(deleted).toBe(true);
      expect(repo.getHabit(habit.id)).toBeUndefined();
    });

    it('returns false for non-existent habit', () => {
      expect(repo.deleteHabit('non-existent')).toBe(false);
    });
  });

  describe('logCompletion', () => {
    it('logs a completion', () => {
      const habit = repo.createHabit(testUserId, 'Test');

      const completion = repo.logCompletion(
        habit.id,
        testUserId
      );

      expect(completion.id).toBeDefined();
      expect(completion.habitId).toBe(habit.id);
      expect(completion.userId).toBe(testUserId);
      expect(completion.completedAt).toBeDefined();
    });

    it('throws on duplicate completion for same day', () => {
      const habit = repo.createHabit(testUserId, 'Test');

      repo.logCompletion(habit.id, testUserId);

      expect(() =>
        repo.logCompletion(habit.id, testUserId)
      ).toThrow('already exists');
    });
  });

  describe('getHeatmapData', () => {
    it('returns 365 days of data', () => {
      const habit = repo.createHabit(testUserId, 'Test');

      const heatmap = repo.getHeatmapData(habit.id);

      expect(heatmap).toHaveLength(365);
    });

    it('includes completion counts', () => {
      const habit = repo.createHabit(testUserId, 'Test');

      repo.logCompletion(habit.id, testUserId);

      const heatmap = repo.getHeatmapData(habit.id);
      const today = heatmap[heatmap.length - 1];

      expect(today.count).toBe(1);
    });
  });
});