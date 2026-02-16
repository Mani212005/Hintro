import { describe, expect, it } from 'vitest';
import { moveTaskInBoard } from '@/utils/boardState';
import type { BoardDetail } from '@/types/api';

const board: BoardDetail = {
  id: 'board-1',
  title: 'Board',
  description: null,
  owner_id: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lists: [
    {
      id: 'list-a',
      title: 'A',
      board_id: 'board-1',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [
        {
          id: 'task-1',
          title: 'Task 1',
          description: null,
          list_id: 'list-a',
          position: 0,
          due_date: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned_to: []
        }
      ]
    },
    {
      id: 'list-b',
      title: 'B',
      board_id: 'board-1',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: []
    }
  ]
};

describe('moveTaskInBoard', () => {
  it('moves task between lists and updates positions', () => {
    const moved = moveTaskInBoard(board, {
      taskId: 'task-1',
      sourceListId: 'list-a',
      destinationListId: 'list-b',
      destinationIndex: 0
    });

    expect(moved.lists[0].tasks).toHaveLength(0);
    expect(moved.lists[1].tasks).toHaveLength(1);
    expect(moved.lists[1].tasks[0].id).toBe('task-1');
    expect(moved.lists[1].tasks[0].position).toBe(0);
  });
});
