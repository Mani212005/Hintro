import { BrowserRouter } from 'react-router-dom';
import { AuthGate } from '@/features/auth/AuthGate';
import { AppRouter } from '@/routes/AppRouter';

const App = () => (
  <BrowserRouter>
    <AuthGate>
      <AppRouter />
    </AuthGate>
  </BrowserRouter>
);

export default App;
