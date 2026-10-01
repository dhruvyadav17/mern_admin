import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <LoadingSpinner message="Loading..." />
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (user.role !== "admin") {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
};

export default AdminRoute;