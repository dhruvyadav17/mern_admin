import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../context/PermissionContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
export default function PermissionRoute({ permission, children }) {
    const { user, loading } = useAuth();
    const { can } = usePermission();
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    if (!can(permission)) return <Navigate to="/403" replace />;
    return children;
}

