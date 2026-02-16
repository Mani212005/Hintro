import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AuthPage } from '@/components/auth/AuthPage';
import { BoardsPage } from '@/components/boards/BoardsPage';
import { BoardDetailPage } from '@/components/boards/BoardDetailPage';

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route
      path="/"
      element={(
        <ProtectedRoute>
          <BoardsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="/boards/:boardId"
      element={(
        <ProtectedRoute>
          <BoardDetailPage />
        </ProtectedRoute>
      )}
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
