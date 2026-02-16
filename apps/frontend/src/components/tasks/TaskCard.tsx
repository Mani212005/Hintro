import { useMemo, useState } from 'react';
import type { TaskEntity } from '@/types/api';
import { formatRelativeDate } from '@/utils/date';

interface TaskCardProps {
  task: TaskEntity;
  currentUserId: string;
  onSave: (updates: { title?: string; description?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  onAssignSelf: () => Promise<void>;
  onUnassignSelf: () => Promise<void>;
}

export const TaskCard = ({ task, currentUserId, onSave, onDelete, onAssignSelf, onUnassignSelf }: TaskCardProps) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');

  const assignedToMe = useMemo(
    () => task.assigned_to.some((assignee) => assignee.id === currentUserId),
    [task.assigned_to, currentUserId]
  );

  const save = async () => {
    await onSave({
      title: title.trim(),
      description: description.trim() || ''
    });
    setEditing(false);
  };

  return (
    <article className="task-card">
      {editing ? (
        <div className="stack">
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Task description"
          />
          <div className="row">
            <button className="primary" onClick={() => void save()}>
              Save
            </button>
            <button className="ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4>{task.title}</h4>
          {task.description ? <p>{task.description}</p> : null}
          <div className="task-meta">
            <span>#{task.position + 1}</span>
            {task.due_date ? <span>Due {formatRelativeDate(task.due_date)}</span> : <span>No due date</span>}
          </div>
          <div className="chip-list">
            {task.assigned_to.map((assignee) => (
              <span key={assignee.id} className="chip">
                {assignee.name}
              </span>
            ))}
            {!task.assigned_to.length ? <span className="chip chip-muted">Unassigned</span> : null}
          </div>
          <div className="row wrap">
            <button className="ghost" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="ghost danger" onClick={() => void onDelete()}>
              Delete
            </button>
            {assignedToMe ? (
              <button className="ghost" onClick={() => void onUnassignSelf()}>
                Unassign me
              </button>
            ) : (
              <button className="ghost" onClick={() => void onAssignSelf()}>
                Assign me
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
};
