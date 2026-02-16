import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { TaskEntity } from '@/types/api';
import { TaskCard } from '@/components/tasks/TaskCard';

interface SortableTaskCardProps {
  task: TaskEntity;
  currentUserId: string;
  onSave: (updates: { title?: string; description?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  onAssignSelf: () => Promise<void>;
  onUnassignSelf: () => Promise<void>;
}

export const SortableTaskCard = ({ task, ...rest }: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-task">
      <div className="drag-handle" {...attributes} {...listeners}>
        Drag
      </div>
      <TaskCard task={task} {...rest} />
    </div>
  );
};
