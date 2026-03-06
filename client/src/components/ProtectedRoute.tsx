import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRole?: 'hr' | 'applicant';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While Supabase is restoring the session, show a spinner
  // This prevents a flash-redirect to /login on page refresh
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f1115',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <img src="/logo.png" alt="SmartCruiter" style={{ width: 56, height: 56, borderRadius: 12, opacity: 0.9 }} />
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user.isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'hr' ? '/admin' : '/candidate/dashboard'} replace />;
  }

  return children;
}
