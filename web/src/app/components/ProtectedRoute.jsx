import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (allowedRoles && !allowedRoles.includes(user?.tipo)) {
    return <Navigate replace to="/app" />;
  }


  return children;
}
