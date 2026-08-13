import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-body)',
      }}>
        Verifying credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-portal" replace />;
  }

  return children;
}
