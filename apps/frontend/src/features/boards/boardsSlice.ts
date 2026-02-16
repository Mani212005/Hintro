import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';
import type {
  ApiSuccess,
  BoardDetail,
  BoardSummary,
  ListEntity,
  PaginationMeta,
  TaskEntity
} from '@/types/api';
import { moveTaskInBoard } from '@/utils/boardState';

interface BoardsState {
  boards: BoardSummary[];
  boardsPagination: PaginationMeta | null;
  currentBoard: BoardDetail | null;
  status: 'idle' | 'loading' | 'error';
  boardStatus: 'idle' | 'loading' | 'error';
  error: string | null;
  optimisticBackup: BoardDetail | null;
}

const initialState: BoardsState = {
  boards: [],
  boardsPagination: null,
  currentBoard: null,
  status: 'idle',
  boardStatus: 'idle',
  error: null,
  optimisticBackup: null
};

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const payload = error.response?.data as { error?: { message?: string } } | undefined;
  return payload?.error?.message || fallback;
};

export const fetchBoards = createAsyncThunk(
  'boards/fetchBoards',
  async (payload: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const page = payload?.page ?? 1;
      const limit = payload?.limit ?? 20;
      const response = await api.get<ApiSuccess<{ boards: BoardSummary[]; pagination: PaginationMeta }>>(
        `/boards?page=${page}&limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to fetch boards'));
    }
  }
);

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (payload: { title: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiSuccess<{ board: BoardSummary }>>('/boards', payload);
      return response.data.data.board;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to create board'));
    }
  }
);

export const fetchBoardById = createAsyncThunk('boards/fetchBoardById', async (boardId: string, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiSuccess<{ board: BoardDetail }>>(`/boards/${boardId}`);
    return response.data.data.board;
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'Failed to load board'));
  }
});

export const createList = createAsyncThunk(
  'boards/createList',
  async (payload: { boardId: string; title: string; position?: number }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiSuccess<{ list: ListEntity }>>(
        `/boards/${payload.boardId}/lists`,
        { title: payload.title, position: payload.position }
      );
      return { boardId: payload.boardId, list: response.data.data.list };
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to create list'));
    }
  }
);

export const updateList = createAsyncThunk(
  'boards/updateList',
  async (payload: { listId: string; title?: string; position?: number }, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiSuccess<{ list: ListEntity }>>(`/lists/${payload.listId}`, {
        title: payload.title,
        position: payload.position
      });
      return response.data.data.list;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to update list'));
    }
  }
);

export const deleteList = createAsyncThunk('boards/deleteList', async (listId: string, { rejectWithValue }) => {
  try {
    await api.delete(`/lists/${listId}`);
    return listId;
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'Failed to delete list'));
  }
});

export const createTask = createAsyncThunk(
  'boards/createTask',
  async (
    payload: { listId: string; title: string; description?: string; dueDate?: string | null; position?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<ApiSuccess<{ task: TaskEntity }>>(`/lists/${payload.listId}/tasks`, {
        title: payload.title,
        description: payload.description,
        due_date: payload.dueDate,
        position: payload.position
      });
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to create task'));
    }
  }
);

export const updateTask = createAsyncThunk(
  'boards/updateTask',
  async (payload: { taskId: string; title?: string; description?: string; dueDate?: string | null }, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiSuccess<{ task: TaskEntity }>>(`/tasks/${payload.taskId}`, {
        title: payload.title,
        description: payload.description,
        due_date: payload.dueDate
      });
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to update task'));
    }
  }
);

export const deleteTask = createAsyncThunk('boards/deleteTask', async (taskId: string, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${taskId}`);
    return taskId;
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'Failed to delete task'));
  }
});

export const moveTask = createAsyncThunk(
  'boards/moveTask',
  async (payload: { taskId: string; destinationListId: string; destinationIndex: number }, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiSuccess<{ task: TaskEntity }>>(`/tasks/${payload.taskId}/move`, {
        list_id: payload.destinationListId,
        position: payload.destinationIndex
      });
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to move task'));
    }
  }
);

export const assignTask = createAsyncThunk(
  'boards/assignTask',
  async (payload: { taskId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiSuccess<{ task: TaskEntity }>>(`/tasks/${payload.taskId}/assign`, {
        user_id: payload.userId
      });
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to assign task'));
    }
  }
);

export const unassignTask = createAsyncThunk(
  'boards/unassignTask',
  async (payload: { taskId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete<ApiSuccess<{ task: TaskEntity }>>(`/tasks/${payload.taskId}/assign/${payload.userId}`);
      return response.data.data.task;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'Failed to unassign task'));
    }
  }
);

const upsertTask = (board: BoardDetail, task: TaskEntity): BoardDetail => ({
  ...board,
  lists: board.lists.map((list) => {
    if (list.id === task.list_id) {
      const existing = list.tasks.find((candidate) => candidate.id === task.id);
      if (existing) {
        return {
          ...list,
          tasks: list.tasks
            .map((candidate) => (candidate.id === task.id ? task : candidate))
            .sort((left, right) => left.position - right.position)
        };
      }

      return {
        ...list,
        tasks: [...list.tasks, task].sort((left, right) => left.position - right.position)
      };
    }

    return {
      ...list,
      tasks: list.tasks.filter((candidate) => candidate.id !== task.id)
    };
  })
});

const removeTask = (board: BoardDetail, taskId: string): BoardDetail => ({
  ...board,
  lists: board.lists.map((list) => ({
    ...list,
    tasks: list.tasks.filter((task) => task.id !== taskId)
  }))
});

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    applyOptimisticMove: (
      state,
      action: {
        payload: {
          taskId: string;
          sourceListId: string;
          destinationListId: string;
          destinationIndex: number;
        };
      }
    ) => {
      if (!state.currentBoard) {
        return;
      }

      state.optimisticBackup = state.currentBoard;
      state.currentBoard = moveTaskInBoard(state.currentBoard, action.payload);
    },
    rollbackOptimisticMove: (state) => {
      if (state.optimisticBackup) {
        state.currentBoard = state.optimisticBackup;
      }

      state.optimisticBackup = null;
    },
    clearOptimisticMove: (state) => {
      state.optimisticBackup = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = 'idle';
        state.boards = action.payload.boards;
        state.boardsPagination = action.payload.pagination;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards = [action.payload, ...state.boards];
      })
      .addCase(fetchBoardById.pending, (state) => {
        state.boardStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.boardStatus = 'idle';
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.boardStatus = 'error';
        state.error = action.payload as string;
      })
      .addCase(createList.fulfilled, (state, action) => {
        if (!state.currentBoard || state.currentBoard.id !== action.payload.boardId) {
          return;
        }

        state.currentBoard = {
          ...state.currentBoard,
          lists: [...state.currentBoard.lists, { ...action.payload.list, tasks: [] }].sort(
            (left, right) => left.position - right.position
          )
        };
      })
      .addCase(updateList.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists
            .map((list) => (list.id === action.payload.id ? { ...list, ...action.payload } : list))
            .sort((left, right) => left.position - right.position)
        };
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists.filter((list) => list.id !== action.payload)
        };
      })
      .addCase(createTask.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = upsertTask(state.currentBoard, action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = upsertTask(state.currentBoard, action.payload);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = removeTask(state.currentBoard, action.payload);
      })
      .addCase(moveTask.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = upsertTask(state.currentBoard, action.payload);
        state.optimisticBackup = null;
      })
      .addCase(moveTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(assignTask.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = upsertTask(state.currentBoard, action.payload);
      })
      .addCase(unassignTask.fulfilled, (state, action) => {
        if (!state.currentBoard) {
          return;
        }

        state.currentBoard = upsertTask(state.currentBoard, action.payload);
      });
  }
});

export const { applyOptimisticMove, rollbackOptimisticMove, clearOptimisticMove } = boardsSlice.actions;
export default boardsSlice.reducer;
