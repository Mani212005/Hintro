import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';
import type { ActivityEntity, ApiSuccess, PaginationMeta } from '@/types/api';

interface ActivityState {
  items: ActivityEntity[];
  pagination: PaginationMeta | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: ActivityState = {
  items: [],
  pagination: null,
  status: 'idle',
  error: null
};

export const fetchActivity = createAsyncThunk(
  'activity/fetchActivity',
  async (payload: { boardId: string; page?: number; limit?: number; actionType?: string }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        page: String(payload.page ?? 1),
        limit: String(payload.limit ?? 20)
      });

      if (payload.actionType) {
        query.set('action_type', payload.actionType);
      }

      const response = await api.get<ApiSuccess<{ activities: ActivityEntity[]; pagination: PaginationMeta }>>(
        `/boards/${payload.boardId}/activity?${query.toString()}`
      );

      return response.data.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'Failed to load activity'
        : 'Failed to load activity';

      return rejectWithValue(message);
    }
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivity.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.activities;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });
  }
});

export default activitySlice.reducer;
