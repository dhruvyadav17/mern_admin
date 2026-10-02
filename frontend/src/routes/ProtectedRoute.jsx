import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Checking authentication..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles?.length &&
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/login" replace />;
    }

    return children || <Outlet />;
};

export default ProtectedRoute;
