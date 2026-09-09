import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { Task, Status, Priority, Category, FormState } from './types';
import { EMPTY_FORM, generateId } from './types';
import { KanbanColumn } from './KanbanColumn';
import styles from './TaskBoard.module.css';

/** Kanban task board component with three columns and inline task creation. */
export function TaskBoard(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'sample-1', title: 'Read the workshop guide',
      description: 'Complete all phases in order — each one unlocks the next.',
      status: 'done', priority: 'high', category: 'work', dueDate: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-2', title: 'Write product.md steering file',
      description: 'Must be done BEFORE running the Spec agent (Phase 1).',
      status: 'todo', priority: 'high', category: 'work', dueDate: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-3', title: 'Run scaffold-module skill × 3',
      description: 'Tasks, Reminders, Habits — one skill run each (Phase 3).',
      status: 'todo', priority: 'medium', category: 'work', dueDate: null,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const visibleTasks = tasks.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleFormChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }, []
  );

  const handleAddTask = useCallback((e: FormEvent): void => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newTask: Task = {
      id: generateId(), title: form.title.trim(), description: form.description.trim(),
      status: 'todo', priority: form.priority, category: form.category,
      dueDate: form.dueDate || null, createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }, [form]);

  const handleStatusChange = useCallback((id: string, newStatus: Status): void => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  }, []);

  const handleDelete = useCallback((id: string): void => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDragStart = useCallback((id: string): void => {
    setDraggedId(id);
  }, []);

  const handleDrop = useCallback((targetStatus: Status): void => {
    if (!draggedId) return;
    handleStatusChange(draggedId, targetStatus);
    setDraggedId(null);
  }, [draggedId, handleStatusChange]);

  const completionRate = tasks.length === 0 ? 0 :
    Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100);

  return (
    <div className={styles.board}>
      <div className={styles.boardHeader}>
        <div>
          <h2 className={styles.boardTitle}>📝 Task Board</h2>
          <p className={styles.boardMeta}>
            {tasks.filter((t) => t.status === 'done').length} / {tasks.length} done
            &nbsp;·&nbsp;{completionRate}% completion rate
          </p>
        </div>
        <button className={styles.addBtn} onClick={(): void => setShowForm((v) => !v)}>
          {showForm ? '✕ Cancel' : '+ New Task'}
        </button>
      </div>

      <div className={styles.filters}>
        <label className={styles.filterLabel}>Category:</label>
        <select className={styles.filterSelect} value={filterCategory}
          onChange={(e): void => setFilterCategory(e.target.value as Category | 'all')}>
          <option value="all">All</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health</option>
        </select>
        <label className={styles.filterLabel}>Priority:</label>
        <select className={styles.filterSelect} value={filterPriority}
          onChange={(e): void => setFilterPriority(e.target.value as Priority | 'all')}>
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAddTask}>
          <input className={styles.input} name="title" placeholder="Task title *"
            value={form.title} onChange={handleFormChange} required />
          <textarea className={styles.textarea} name="description"
            placeholder="Description (optional)" value={form.description}
            onChange={handleFormChange} rows={2} />
          <div className={styles.formRow}>
            <select className={styles.select} name="priority"
              value={form.priority} onChange={handleFormChange}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select className={styles.select} name="category"
              value={form.category} onChange={handleFormChange}>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
            </select>
            <input className={styles.input} type="date" name="dueDate"
              value={form.dueDate} onChange={handleFormChange} />
            <button className={styles.submitBtn} type="submit">Add</button>
          </div>
        </form>
      )}

      <div className={styles.columns}>
        {(['todo', 'in_progress', 'done'] as Status[]).map((status) => (
          <KanbanColumn key={status} status={status}
            tasks={visibleTasks.filter((t) => t.status === status)}
            isDropTarget={draggedId !== null} onDrop={handleDrop}
            onStatusChange={handleStatusChange} onDelete={handleDelete}
            onDragStart={handleDragStart} />
        ))}
      </div>
    </div>
  );
}
