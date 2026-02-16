import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import authReducer from '@/features/auth/authSlice';
import boardsReducer from '@/features/boards/boardsSlice';
import activityReducer from '@/features/activity/activitySlice';
import searchReducer from '@/features/search/searchSlice';
import socketReducer from '@/features/socket/socketSlice';
import { AuthPage } from '@/components/auth/AuthPage';

const renderAuthPage = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      boards: boardsReducer,
      activity: activityReducer,
      search: searchReducer,
      socket: socketReducer
    }
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    </Provider>
  );
};

describe('AuthPage', () => {
  it('switches between login and signup forms', async () => {
    const user = userEvent.setup();
    renderAuthPage();

    expect(screen.queryByText('Name')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Signup' }));

    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
