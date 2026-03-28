import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../app/AuthContext";

export function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Cargando sesion...</p>;
  }

  if (!token) {
    if (location.pathname === "/") {
      return <Navigate to="/comercia" replace />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
