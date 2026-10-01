import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-vh-100 bg-light">

            {/* Navbar */}
            <nav className="navbar navbar-dark bg-dark px-3">
                <span className="navbar-brand mb-0 h1">
                    MERN Admin
                </span>

                <div className="d-flex align-items-center gap-3">

                    <span className="text-white">
                        {user?.name}
                    </span>

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

                {/* Sidebar */}
                <aside
                    className="bg-white border-end p-3"
                    style={{
                        width: "240px",
                        minHeight: "calc(100vh - 56px)"
                    }}
                >
                    <h6 className="text-muted mb-3">
                        MENU
                    </h6>

                    <div className="nav flex-column gap-1">

                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) =>
                                `nav-link ${
                                    isActive
                                        ? "active bg-primary text-white"
                                        : "text-dark"
                                }`
                            }
                        >
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) =>
                                `nav-link ${
                                    isActive
                                        ? "active bg-primary text-white"
                                        : "text-dark"
                                }`
                            }
                        >
                            Users
                        </NavLink>

                    </div>
                </aside>

                {/* Page Content */}
                <main className="flex-grow-1 p-4">
                    <Outlet />
                </main>

            </div>

        </div>
    );
};

export default AdminLayout;