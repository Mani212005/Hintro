import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { markInitialized, loadMe, refreshSessionThunk, clearAuthSession } from './authSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { disconnectSocket } from '@/services/socket';

interface Props {
  children: ReactNode;
}

export const AuthGate = ({ children }: Props) => {
  const dispatch = useAppDispatch();
  const { token, refreshToken, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (initialized && !token) {
      disconnectSocket();
    }
  }, [initialized, token]);

  useEffect(() => {
    const initialize = async () => {
      if (!token && !refreshToken) {
        dispatch(markInitialized());
        return;
      }

      if (!token && refreshToken) {
        const refreshed = await dispatch(refreshSessionThunk(refreshToken));
        if (refreshSessionThunk.rejected.match(refreshed)) {
          dispatch(clearAuthSession());
          dispatch(markInitialized());
          return;
        }
      }

      const me = await dispatch(loadMe());
      if (loadMe.rejected.match(me)) {
        dispatch(clearAuthSession());
      }

      dispatch(markInitialized());
    };

    if (!initialized) {
      void initialize();
    }
  }, [dispatch, token, refreshToken, initialized]);

  if (!initialized) {
    return <div className="center-screen">Loading session...</div>;
  }

  return <>{children}</>;
};
