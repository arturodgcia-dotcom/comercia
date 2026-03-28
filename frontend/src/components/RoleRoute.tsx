import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/AuthContext";

export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Cargando sesion...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

