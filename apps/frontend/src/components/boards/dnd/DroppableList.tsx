import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface DroppableListProps {
  listId: string;
  children: ReactNode;
}

export const DroppableList = ({ listId, children }: DroppableListProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `list-${listId}` });

  return (
    <div ref={setNodeRef} className={`list-column ${isOver ? 'is-over' : ''}`}>
      {children}
    </div>
  );
};
