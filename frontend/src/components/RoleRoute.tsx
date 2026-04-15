import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { hasPermission } from "../utils/accessControl";

type RoleRouteProps = {
  allowedRoles?: string[];
  allowedPermissions?: string[];
};

export function RoleRoute({ allowedRoles = [], allowedPermissions = [] }: RoleRouteProps) {
  const { user, loading } = useAuth();
  if (loading) return <p>Cargando sesion...</p>;
  if (!user) return <Navigate to="/login" replace />;

  const passesRoleCheck = allowedRoles.length === 0 || allowedRoles.includes(user.role);
  const passesPermissionCheck = allowedPermissions.length === 0 || allowedPermissions.some((key) => hasPermission(user, key));
  if (!passesRoleCheck && !passesPermissionCheck) return <Navigate to="/comercia" replace />;

  return <Outlet />;
}
