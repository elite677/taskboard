import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BoardPage from './pages/BoardPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/boards/:id" element={<Protected><BoardPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
