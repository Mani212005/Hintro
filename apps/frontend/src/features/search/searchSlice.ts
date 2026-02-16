import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';
import type { ApiSuccess, PaginationMeta, SearchResult } from '@/types/api';

interface SearchState {
  query: string;
  results: SearchResult[];
  pagination: PaginationMeta | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: SearchState = {
  query: '',
  results: [],
  pagination: null,
  status: 'idle',
  error: null
};

export const searchEntities = createAsyncThunk(
  'search/searchEntities',
  async (
    payload: {
      query: string;
      boardId?: string;
      type?: 'board' | 'list' | 'task';
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        query: payload.query,
        page: String(payload.page ?? 1),
        limit: String(payload.limit ?? 20)
      });

      if (payload.boardId) {
        params.set('board_id', payload.boardId);
      }

      if (payload.type) {
        params.set('type', payload.type);
      }

      const response = await api.get<ApiSuccess<{ results: SearchResult[]; pagination: PaginationMeta }>>(
        `/search?${params.toString()}`
      );

      return { ...response.data.data, query: payload.query };
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'Search failed'
        : 'Search failed';

      return rejectWithValue(message);
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.query = '';
      state.results = [];
      state.pagination = null;
      state.error = null;
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchEntities.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchEntities.fulfilled, (state, action) => {
        state.status = 'idle';
        state.query = action.payload.query;
        state.results = action.payload.results;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchEntities.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });
  }
});

export const { clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
