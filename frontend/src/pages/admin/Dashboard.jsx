import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import userService from "../../services/userService";
import dashboardService from "../../services/dashboardService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { USER_STATUS } from "../../constants/userConstants";
import { getApiErrorMessage } from "../../utils/apiError";

const initialStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    normalUsers: 0
};

const Dashboard = () => {
    const [stats, setStats] = useState(initialStats);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError("");

            try {
                const [statsResponse, usersResponse] = await Promise.all([
                    dashboardService.getStats(),
                    userService.getUsers({ page: 1, limit: 5 })
                ]);

                setStats(statsResponse.data.data || initialStats);
                setRecentUsers(usersResponse.data.data || []);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "Failed to load dashboard"
                    )
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    const statCards = [
        ["Total Users", stats.totalUsers, "text-dark"],
        ["Active Users", stats.activeUsers, "text-success"],
        ["Inactive Users", stats.inactiveUsers, "text-danger"],
        ["Admin Users", stats.adminUsers, "text-primary"]
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Dashboard</h2>
                    <p className="text-muted mb-0">
                        Overview of your application
                    </p>
                </div>

                <Link
                    to="/admin/users/create"
                    className="btn btn-primary"
                >
                    + Add User
                </Link>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row g-4 mb-4">
                {statCards.map(([label, value, className]) => (
                    <div className="col-md-6 col-xl-3" key={label}>
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted">{label}</h6>
                                <h2 className={`mb-0 ${className}`}>
                                    {value}
                                </h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Recent Users</h5>
                            <Link
                                to="/admin/users"
                                className="btn btn-sm btn-outline-primary"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="card-body p-0">
                            {recentUsers.length === 0 ? (
                                <EmptyState message="No users found" />
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className="badge bg-secondary">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge ${
                                                                user.status === USER_STATUS.ACTIVE
                                                                    ? "bg-success"
                                                                    : "bg-danger"
                                                            }`}
                                                        >
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Quick Actions</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <Link
                                    to="/admin/users/create"
                                    className="btn btn-primary"
                                >
                                    + Create User
                                </Link>
                                <Link
                                    to="/admin/users"
                                    className="btn btn-outline-primary"
                                >
                                    Manage Users
                                </Link>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between">
                                <span className="text-muted">
                                    Normal Users
                                </span>
                                <strong>{stats.normalUsers}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
