import type { Activity, Board, List, Task, User } from '@prisma/client';

export const serializeUser = (user: Pick<User, 'id' | 'name' | 'email' | 'createdAt'>) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  created_at: user.createdAt.toISOString()
});

export const serializeBoard = (board: Board & { membersCount?: number }) => ({
  id: board.id,
  title: board.title,
  description: board.description,
  owner_id: board.ownerId,
  members_count: board.membersCount,
  created_at: board.createdAt.toISOString(),
  updated_at: board.updatedAt.toISOString()
});

export const serializeList = (list: List) => ({
  id: list.id,
  title: list.title,
  board_id: list.boardId,
  position: list.position,
  created_at: list.createdAt.toISOString(),
  updated_at: list.updatedAt.toISOString()
});

export const serializeTask = (
  task: Task & { assignments?: Array<{ user: Pick<User, 'id' | 'name' | 'email'> }> }
) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  list_id: task.listId,
  position: task.position,
  due_date: task.dueDate ? task.dueDate.toISOString() : null,
  created_by: task.createdById,
  created_at: task.createdAt.toISOString(),
  updated_at: task.updatedAt.toISOString(),
  assigned_to: task.assignments?.map((assignment) => ({
    id: assignment.user.id,
    name: assignment.user.name,
    email: assignment.user.email
  })) ?? []
});

export const serializeActivity = (
  activity: Activity & {
    user?: Pick<User, 'id' | 'name'> | null;
    task?: Pick<Task, 'id' | 'title'> | null;
  }
) => ({
  id: activity.id,
  board_id: activity.boardId,
  task_id: activity.taskId,
  user_id: activity.userId,
  action_type: activity.actionType,
  metadata: activity.metadata,
  created_at: activity.createdAt.toISOString(),
  user: activity.user ? { id: activity.user.id, name: activity.user.name } : null,
  task: activity.task ? { id: activity.task.id, title: activity.task.title } : null
});
