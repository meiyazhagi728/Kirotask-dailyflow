import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import {
  createReminder,
  listReminders,
  getReminder,
  updateReminder,
  deleteReminder,
  acknowledgeReminder,
  snoozeReminder,
} from './repository';
import type {
  CreateReminderDto,
  UpdateReminderDto,
} from './types';

// Clean database before each test
beforeEach(() => {
  db.exec('DELETE FROM reminders');
});

describe('Reminder Repository', () => {
  const testUserId = 'test-user-id';

  describe('createReminder', () => {
    it('creates a reminder with all required fields', () => {
      const dto: CreateReminderDto = {
        userId: testUserId,
        title: 'Test reminder',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
      };

      const reminder = createReminder(dto);

      expect(reminder.id).toBeDefined();
      expect(reminder.userId).toBe(testUserId);
      expect(reminder.title).toBe('Test reminder');
      expect(reminder.scheduledAt).toBe('2024-12-25T10:00:00Z');
      expect(reminder.category).toBe('work');
      expect(reminder.recurrence).toBe('none');
      expect(reminder.acknowledged).toBe(false);
      expect(reminder.acknowledgedAt).toBeNull();
      expect(reminder.createdAt).toBeDefined();
    });

    it('creates a reminder with recurrence', () => {
      const dto: CreateReminderDto = {
        userId: testUserId,
        title: 'Daily standup',
        scheduledAt: '2024-12-25T09:00:00Z',
        category: 'work',
        recurrence: 'daily',
      };

      const reminder = createReminder(dto);

      expect(reminder.recurrence).toBe('daily');
    });
  });

  describe('listReminders', () => {
    it('returns empty array when no reminders exist', () => {
      const reminders = listReminders(testUserId);

      expect(reminders).toEqual([]);
    });

    it('returns all reminders for a user ordered by scheduledAt asc', () => {
      createReminder({
        userId: testUserId,
        title: 'Late',
        scheduledAt: '2024-12-25T15:00:00Z',
        category: 'work',
      });

      createReminder({
        userId: testUserId,
        title: 'Early',
        scheduledAt: '2024-12-25T08:00:00Z',
        category: 'work',
      });

      const reminders = listReminders(testUserId);

      expect(reminders).toHaveLength(2);
      expect(reminders[0].title).toBe('Early');
      expect(reminders[1].title).toBe('Late');
    });
  });

  describe('updateReminder', () => {
    it('updates reminder title', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'Original title',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
      });

      const updated = updateReminder(created.id, {
        title: 'New title',
      });

      expect(updated?.title).toBe('New title');
    });
  });

  describe('deleteReminder', () => {
    it('deletes an existing reminder', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'To delete',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
      });

      const deleted = deleteReminder(created.id);

      expect(deleted).toBe(true);

      const reminder = getReminder(created.id);

      expect(reminder).toBeUndefined();
    });
  });

  describe('acknowledgeReminder', () => {
    it('sets acknowledged to true', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'Test reminder',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
      });

      expect(created.acknowledged).toBe(false);

      const updated = acknowledgeReminder(created.id);

      expect(updated?.acknowledged).toBe(true);
      expect(updated?.acknowledgedAt).toBeDefined();
    });

    it('creates new reminder for daily recurrence (24 hours later)', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'Daily standup',
        scheduledAt: '2024-12-25T09:00:00Z',
        category: 'work',
        recurrence: 'daily',
      });

      acknowledgeReminder(created.id);

      const allReminders = listReminders(testUserId);

      expect(allReminders).toHaveLength(2);

      const newReminder = allReminders.find(
        (reminder) => reminder.id !== created.id
      );

      expect(newReminder?.scheduledAt).toBe(
        '2024-12-26T09:00:00.000Z'
      );

      expect(newReminder?.acknowledged).toBe(false);
    });

    it('creates new reminder for weekly recurrence (7 days later)', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'Weekly review',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
        recurrence: 'weekly',
      });

      acknowledgeReminder(created.id);

      const allReminders = listReminders(testUserId);

      expect(allReminders).toHaveLength(2);

      const newReminder = allReminders.find(
        (reminder) => reminder.id !== created.id
      );

      // 7 days after 2024-12-25 is 2025-01-01
      expect(newReminder?.scheduledAt).toBe(
        '2025-01-01T10:00:00.000Z'
      );

      expect(newReminder?.acknowledged).toBe(false);
    });
  });

  describe('snoozeReminder', () => {
    it('advances scheduledAt by specified minutes', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'Test reminder',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
      });

      const updated = snoozeReminder(created.id, 30);

      expect(updated?.scheduledAt).toBe(
        '2024-12-25T10:30:00.000Z'
      );
    });

    it('advances scheduledAt by 60 minutes (1 hour)', () => {
      const created = createReminder({
        userId: testUserId,
        title: 'Test reminder',
        scheduledAt: '2024-12-25T10:00:00Z',
        category: 'work',
      });

      const updated = snoozeReminder(created.id, 60);

      expect(updated?.scheduledAt).toBe(
        '2024-12-25T11:00:00.000Z'
      );
    });
  });
});

describe('Snooze validation (Requirement 5.4)', () => {
  const testUserId = 'test-user-id';

  it('accepts snooze of 1 minute (minimum)', () => {
    const created = createReminder({
      userId: testUserId,
      title: 'Test',
      scheduledAt: '2024-12-25T10:00:00Z',
      category: 'work',
    });

    const updated = snoozeReminder(created.id, 1);

    expect(updated?.scheduledAt).toBe(
      '2024-12-25T10:01:00.000Z'
    );
  });

  it('accepts snooze of 1440 minutes (maximum = 1 day)', () => {
    const created = createReminder({
      userId: testUserId,
      title: 'Test',
      scheduledAt: '2024-12-25T10:00:00Z',
      category: 'work',
    });

    const updated = snoozeReminder(created.id, 1440);

    expect(updated?.scheduledAt).toBe(
      '2024-12-26T10:00:00.000Z'
    );
  });
});