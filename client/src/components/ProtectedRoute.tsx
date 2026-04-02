import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRole?: 'hr' | 'applicant' | 'super_admin';
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return children;
}
