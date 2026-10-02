import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/admin/Dashboard";
import UserList from "../pages/admin/users/UserList";
import UserCreate from "../pages/admin/users/UserCreate";
import UserEdit from "../pages/admin/users/UserEdit";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import { USER_ROLES } from "../constants/userConstants";

const AppRoutes = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserList />} />
                <Route path="users/create" element={<UserCreate />} />
                <Route path="users/:id/edit" element={<UserEdit />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
);

export default AppRoutes;
