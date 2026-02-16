import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuthError, login, setAuthMode, signup } from '@/features/auth/authSlice';

export const AuthPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mode, status, error, token, user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loading = status === 'loading';

  const canSubmit = useMemo(() => {
    if (mode === 'signup') {
      return name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;
    }

    return email.trim().length > 0 && password.length >= 8;
  }, [mode, name, email, password]);

  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);

  useEffect(
    () => () => {
      dispatch(clearAuthError());
    },
    [dispatch]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (mode === 'signup') {
      await dispatch(signup({ name, email, password }));
      return;
    }

    await dispatch(login({ email, password }));
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Taskflow</p>
        <h1>{mode === 'signup' ? 'Create your workspace account' : 'Welcome back'}</h1>
        <p className="muted">Realtime board collaboration with activity logs and drag-and-drop planning.</p>

        <div className="auth-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => dispatch(setAuthMode('login'))}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => dispatch(setAuthMode('signup'))}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' ? (
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mani Kumar" />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mani@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="SecurePass123!"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary" disabled={!canSubmit || loading}>
            {loading ? 'Working...' : mode === 'signup' ? 'Create account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
