export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponseData {
  token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface BoardSummary {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  members_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
}

export interface TaskEntity {
  id: string;
  title: string;
  description: string | null;
  list_id: string;
  position: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: Assignee[];
}

export interface ListEntity {
  id: string;
  title: string;
  board_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  tasks: TaskEntity[];
}

export interface BoardDetail extends BoardSummary {
  lists: ListEntity[];
}

export interface ActivityEntity {
  id: string;
  board_id: string;
  task_id: string | null;
  user_id: string | null;
  action_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
}

export interface SearchResult {
  type: 'board' | 'list' | 'task';
  id: string;
  title: string;
  board: { id: string; title: string };
  list: { id: string; title: string } | null;
}
