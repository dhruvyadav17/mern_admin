import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logout successful");
            navigate("/login", { replace: true });
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    const navLinkClass = ({ isActive }) =>
        `nav-link ${isActive ? "active bg-primary text-white" : "text-dark"}`;

    return (
        <div className="min-vh-100 bg-light">
            <nav className="navbar navbar-dark bg-dark px-3">
                <span className="navbar-brand mb-0 h1">MERN Admin</span>

                <div className="d-flex align-items-center gap-3">
                    <span className="text-white">{user?.name}</span>
                    <button
                        type="button"
                        className="btn btn-outline-light btn-sm"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="d-flex">
                <aside
                    className="bg-white border-end p-3"
                    style={{
                        width: "240px",
                        minHeight: "calc(100vh - 56px)"
                    }}
                >
                    <h6 className="text-muted mb-3">MENU</h6>

                    <div className="nav flex-column gap-1">
                        <NavLink
                            to="/admin"
                            end
                            className={navLinkClass}
                        >
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/admin/users"
                            className={navLinkClass}
                        >
                            Users
                        </NavLink>
                    </div>
                </aside>

                <main className="flex-grow-1 p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
