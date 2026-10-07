import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

const PermissionContext = createContext(null);
export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const permissions = useMemo(() => new Set(user?.permissions || []), [user]);
  const can = (permission) =>
    permissions.has("*") || permissions.has(permission);
  const canAny = (items = []) => items.some(can);
  return (
    <PermissionContext.Provider value={{ permissions, can, canAny }}>
      {children}
    </PermissionContext.Provider>
  );
}
export const usePermission = () => useContext(PermissionContext);
export function Can({ permission, permissions, children, fallback = null }) {
  const { can, canAny } = usePermission();
  if (!permission && !permissions) return children;
  return (permission ? can(permission) : canAny(permissions || []))
    ? children
    : fallback;
}
