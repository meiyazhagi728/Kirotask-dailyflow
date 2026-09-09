import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from './repository';
import type { CreateTaskDto } from './types';

const TEST_USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user';

function ensureTestUser(userId: string) {
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name)
    VALUES (?, ?, ?)
  `).run(
    userId,
    `${userId}@test.local`,
    userId
  );
}

// Clean database before each test
beforeEach(() => {
  db.exec('DELETE FROM tasks');

  ensureTestUser(TEST_USER_ID);
  ensureTestUser(OTHER_USER_ID);
});

describe('Task Repository', () => {
  const testUserId = TEST_USER_ID;

  describe('createTask', () => {
    it('creates a task with all required fields', () => {
      const dto: CreateTaskDto = {
        userId: testUserId,
        title: 'Test task',
        priority: 'medium',
        category: 'work',
      };

      const task = createTask(dto);

      expect(task.id).toBeDefined();
      expect(task.userId).toBe(testUserId);
      expect(task.title).toBe('Test task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.category).toBe('work');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    it('creates a task with status provided', () => {
      const dto: CreateTaskDto = {
        userId: testUserId,
        title: 'In progress task',
        priority: 'high',
        category: 'personal',
        status: 'in_progress',
      };

      const task = createTask(dto);

      expect(task.status).toBe('in_progress');
    });

    it('creates a task with dueDate provided', () => {
      const dto: CreateTaskDto = {
        userId: testUserId,
        title: 'Task with due date',
        priority: 'low',
        category: 'health',
        dueDate: '2024-12-31',
      };

      const task = createTask(dto);

      expect(task.dueDate).toBe('2024-12-31');
    });
  });

  describe('listTasks', () => {
    it('returns empty array when no tasks exist', () => {
      const tasks = listTasks(testUserId);

      expect(tasks).toEqual([]);
    });

    it('returns all tasks for a user ordered by createdAt desc', () => {
      createTask({
        userId: testUserId,
        title: 'First',
        priority: 'low',
        category: 'work',
      });

      createTask({
        userId: testUserId,
        title: 'Second',
        priority: 'low',
        category: 'work',
      });

      createTask({
        userId: testUserId,
        title: 'Third',
        priority: 'low',
        category: 'work',
      });

      const tasks = listTasks(testUserId);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Third');
      expect(tasks[1].title).toBe('Second');
      expect(tasks[2].title).toBe('First');
    });

    it('only returns tasks for the specified user', () => {
      createTask({
        userId: testUserId,
        title: 'User 1 task',
        priority: 'low',
        category: 'work',
      });

      createTask({
        userId: OTHER_USER_ID,
        title: 'User 2 task',
        priority: 'low',
        category: 'work',
      });

      const tasks = listTasks(testUserId);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('User 1 task');
    });
  });

  describe('getTask', () => {
    it('returns a task by ID', () => {
      const created = createTask({
        userId: testUserId,
        title: 'Test task',
        priority: 'medium',
        category: 'work',
      });

      const task = getTask(created.id);

      expect(task).toBeDefined();
      expect(task?.title).toBe('Test task');
    });

    it('returns undefined for non-existent task', () => {
      const task = getTask('non-existent-id');

      expect(task).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('updates task title', () => {
      const created = createTask({
        userId: testUserId,
        title: 'Original title',
        priority: 'medium',
        category: 'work',
      });

      const updated = updateTask(created.id, {
        title: 'New title',
      });

      expect(updated?.title).toBe('New title');
      expect(updated?.status).toBe('todo');
    });

    it('sets completedAt when status changes to done', () => {
      const created = createTask({
        userId: testUserId,
        title: 'Test task',
        priority: 'medium',
        category: 'work',
        status: 'todo',
      });

      expect(created.completedAt).toBeNull();

      const updated = updateTask(created.id, {
        status: 'done',
      });

      expect(updated?.status).toBe('done');
      expect(updated?.completedAt).toBeDefined();
      expect(updated?.completedAt).not.toBeNull();
    });

    it('clears completedAt when status changes from done to todo', () => {
      const created = createTask({
        userId: testUserId,
        title: 'Test task',
        priority: 'medium',
        category: 'work',
        status: 'done',
      });

      const withDone = updateTask(created.id, {
        status: 'done',
      });

      expect(withDone?.completedAt).toBeDefined();
      expect(withDone?.completedAt).not.toBeNull();

      const updated = updateTask(created.id, {
        status: 'todo',
      });

      expect(updated?.status).toBe('todo');
      expect(updated?.completedAt).toBeNull();
    });

    it('returns undefined for non-existent task', () => {
      const updated = updateTask(
        'non-existent-id',
        { title: 'New title' }
      );

      expect(updated).toBeUndefined();
    });
  });

  describe('deleteTask', () => {
    it('deletes an existing task', () => {
      const created = createTask({
        userId: testUserId,
        title: 'Task to delete',
        priority: 'medium',
        category: 'work',
      });

      const deleted = deleteTask(created.id);

      expect(deleted).toBe(true);

      const task = getTask(created.id);

      expect(task).toBeUndefined();
    });

    it('returns false for non-existent task', () => {
      const deleted = deleteTask('non-existent-id');

      expect(deleted).toBe(false);
    });
  });
});

describe('completedAt lifecycle (Requirement 3)', () => {
  const testUserId = TEST_USER_ID;

  it('sets completedAt when status transitions to done', () => {
    const task = createTask({
      userId: testUserId,
      title: 'Test task',
      priority: 'medium',
      category: 'work',
      status: 'todo',
    });

    expect(task.completedAt).toBeNull();

    const updated = updateTask(task.id, {
      status: 'done',
    });

    expect(updated?.completedAt).not.toBeNull();
    expect(updated?.completedAt).toBeDefined();
  });

  it('clears completedAt when status changes away from done', () => {
    const task = createTask({
      userId: testUserId,
      title: 'Test task',
      priority: 'medium',
      category: 'work',
      status: 'done',
    });

    const doneTask = updateTask(task.id, {
      status: 'done',
    });

    expect(doneTask?.completedAt).not.toBeNull();

    const updated = updateTask(task.id, {
      status: 'in_progress',
    });

    expect(updated?.completedAt).toBeNull();
  });

  it('preserves completedAt when status stays done', () => {
    const task = createTask({
      userId: testUserId,
      title: 'Test task',
      priority: 'medium',
      category: 'work',
      status: 'todo',
    });

    const updated1 = updateTask(task.id, {
      status: 'done',
    });

    const completedAt = updated1?.completedAt;

    expect(completedAt).not.toBeNull();

    const updated2 = updateTask(task.id, {
      title: 'Updated title',
    });

    expect(updated2?.completedAt).toBe(completedAt);
  });
});