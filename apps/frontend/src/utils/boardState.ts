import type { BoardDetail, TaskEntity } from '@/types/api';

export interface MoveTaskInput {
  taskId: string;
  sourceListId: string;
  destinationListId: string;
  destinationIndex: number;
}

const cloneTask = (task: TaskEntity, listId: string, position: number): TaskEntity => ({
  ...task,
  list_id: listId,
  position
});

export const moveTaskInBoard = (board: BoardDetail, input: MoveTaskInput): BoardDetail => {
  const lists = board.lists.map((list) => ({
    ...list,
    tasks: [...list.tasks]
  }));

  const sourceList = lists.find((list) => list.id === input.sourceListId);
  const destinationList = lists.find((list) => list.id === input.destinationListId);

  if (!sourceList || !destinationList) {
    return board;
  }

  const sourceIndex = sourceList.tasks.findIndex((task) => task.id === input.taskId);
  if (sourceIndex === -1) {
    return board;
  }

  const [task] = sourceList.tasks.splice(sourceIndex, 1);

  const targetIndex = Math.max(0, Math.min(input.destinationIndex, destinationList.tasks.length));
  destinationList.tasks.splice(targetIndex, 0, cloneTask(task, destinationList.id, targetIndex));

  sourceList.tasks = sourceList.tasks.map((currentTask, idx) => cloneTask(currentTask, sourceList.id, idx));
  destinationList.tasks = destinationList.tasks.map((currentTask, idx) => cloneTask(currentTask, destinationList.id, idx));

  return {
    ...board,
    lists
  };
};
