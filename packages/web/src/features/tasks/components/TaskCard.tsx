import type { Task, Status } from './types';
import { PRIORITY_COLOURS, formatDate } from './types';
import styles from './TaskBoard.module.css';

export interface TaskCardProps {
  task: Task;
  column: Status;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
}

/**
 * TaskCard component renders an individual task card with actions.
 * @param props - TaskCardProps containing task data and handlers
 * @returns The task card UI
 */
export function TaskCard({
  task,
  column,
  onStatusChange,
  onDelete,
  onDragStart,
}: TaskCardProps): JSX.Element {
  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(): void => onDragStart(task.id)}
    >
      <div className={styles.cardTop}>
        <span
          className={styles.priorityDot}
          style={{ background: PRIORITY_COLOURS[task.priority] }}
          title={`${task.priority} priority`}
        />
        <span className={styles.cardTitle}>{task.title}</span>
      </div>
      {task.description && (
        <p className={styles.cardDesc}>{task.description}</p>
      )}
      <div className={styles.cardMeta}>
        <span className={styles.categoryTag}>{task.category}</span>
        {task.dueDate && (
          <span className={styles.dueDate}>📅 {formatDate(task.dueDate)}</span>
        )}
      </div>
      <div className={styles.cardActions}>
        {column !== 'todo' && (
          <button
            className={styles.actionBtn}
            onClick={(): void =>
              onStatusChange(task.id, column === 'in_progress' ? 'todo' : 'in_progress')
            }
          >
            ← Back
          </button>
        )}
        {column !== 'done' && (
          <button
            className={styles.actionBtn}
            onClick={(): void =>
              onStatusChange(task.id, column === 'todo' ? 'in_progress' : 'done')
            }
          >
            Forward →
          </button>
        )}
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={(): void => onDelete(task.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
