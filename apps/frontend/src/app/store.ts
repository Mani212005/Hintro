import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import boardsReducer from '@/features/boards/boardsSlice';
import activityReducer from '@/features/activity/activitySlice';
import searchReducer from '@/features/search/searchSlice';
import socketReducer from '@/features/socket/socketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    boards: boardsReducer,
    activity: activityReducer,
    search: searchReducer,
    socket: socketReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
