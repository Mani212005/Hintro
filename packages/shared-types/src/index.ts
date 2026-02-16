export type UserRole = 'admin' | 'member';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AssigneeDTO {
  id: string;
  name: string;
  email: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  position: number;
  dueDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: AssigneeDTO[];
}

export interface ListDTO {
  id: string;
  title: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  tasks?: TaskDTO[];
}

export interface BoardDTO {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  membersCount?: number;
  lists?: ListDTO[];
}

export interface ActivityDTO {
  id: string;
  boardId: string;
  taskId: string | null;
  userId: string | null;
  actionType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SocketBoardPayload {
  board_id: string;
}

export interface SocketTaskCreatedPayload {
  task: TaskDTO;
  list_id: string;
}

export interface SocketTaskUpdatedPayload {
  task_id: string;
  changes: Partial<TaskDTO>;
}

export interface SocketTaskDeletedPayload {
  task_id: string;
  list_id: string;
}

export interface SocketTaskMovedPayload {
  task_id: string;
  from_list: string;
  to_list: string;
  position: number;
}

export interface SocketActivityLoggedPayload {
  activity: ActivityDTO;
}
