import ProtectedRoute from "./ProtectedRoute";
import { USER_ROLES } from "../constants/userConstants";

const AdminRoute = ({ children }) => (
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
        {children}
    </ProtectedRoute>
);

export default AdminRoute;
