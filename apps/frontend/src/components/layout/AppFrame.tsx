import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { disconnectSocket } from '@/services/socket';

interface AppFrameProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const AppFrame = ({ title, subtitle, children }: AppFrameProps) => {
  const dispatch = useAppDispatch();
  const { user, refreshToken } = useAppSelector((state) => state.auth);

  const onLogout = async () => {
    disconnectSocket();
    await dispatch(logout(refreshToken));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Taskflow</p>
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>

        <div className="topbar-actions">
          <div className="user-pill">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <Link to="/" className="ghost">
            Boards
          </Link>
          <button className="ghost" onClick={() => void onLogout()}>
            Logout
          </button>
        </div>
      </header>

      {children}
    </div>
  );
};
