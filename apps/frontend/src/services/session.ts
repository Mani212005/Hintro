import type { AuthUser } from '@/types/api';

const STORAGE_KEY = 'taskflow.session';

export interface SessionState {
  token: string;
  refreshToken: string;
  user: AuthUser | null;
}

export const loadSession = (): SessionState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed.token || !parsed.refreshToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveSession = (session: SessionState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
