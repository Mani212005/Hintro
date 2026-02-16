import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from '@/app/store';
import { registerApiAuth } from '@/services/api';
import { clearAuthSession, refreshSessionThunk } from '@/features/auth/authSlice';
import '@/styles/global.css';

registerApiAuth({
  getToken: () => store.getState().auth.token,
  refreshAuth: async () => {
    const refreshToken = store.getState().auth.refreshToken;
    if (!refreshToken) {
      store.dispatch(clearAuthSession());
      return null;
    }

    const result = await store.dispatch(refreshSessionThunk(refreshToken));
    if (refreshSessionThunk.fulfilled.match(result)) {
      return result.payload.token;
    }

    store.dispatch(clearAuthSession());
    return null;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
