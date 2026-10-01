import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../api/axios";

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        adminUsers: 0,
        normalUsers: 0
    });

    const [recentUsers, setRecentUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const [
                statsResponse,
                usersResponse
            ] = await Promise.all([
                api.get("/dashboard/stats"),

                api.get("/users", {
                    params: {
                        page: 1,
                        limit: 5
                    }
                })
            ]);

            setStats(statsResponse.data.data);

            setRecentUsers(
                usersResponse.data.data
            );

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to load dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-5">

                <div
                    className="spinner-border text-primary"
                    role="status"
                >
                    <span className="visually-hidden">
                        Loading...
                    </span>
                </div>

                <div className="mt-2 text-muted">
                    Loading dashboard...
                </div>

            </div>
        );
    }

    return (
        <div>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="mb-1">
                        Dashboard
                    </h2>

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

            {/* Error */}
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="row g-4 mb-4">

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted">
                                Total Users
                            </h6>

                            <h2 className="mb-0">
                                {stats.totalUsers}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted">
                                Active Users
                            </h6>

                            <h2 className="mb-0 text-success">
                                {stats.activeUsers}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted">
                                Inactive Users
                            </h6>

                            <h2 className="mb-0 text-danger">
                                {stats.inactiveUsers}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted">
                                Admin Users
                            </h6>

                            <h2 className="mb-0 text-primary">
                                {stats.adminUsers}
                            </h2>
                        </div>
                    </div>
                </div>

            </div>

            {/* Main Content */}
            <div className="row g-4">

                {/* Recent Users */}
                <div className="col-lg-8">

                    <div className="card shadow-sm">

                        <div className="card-header bg-white d-flex justify-content-between align-items-center">

                            <h5 className="mb-0">
                                Recent Users
                            </h5>

                            <Link
                                to="/admin/users"
                                className="btn btn-sm btn-outline-primary"
                            >
                                View All
                            </Link>

                        </div>

                        <div className="card-body p-0">

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

                                        {recentUsers.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center py-4 text-muted"
                                                >
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            recentUsers.map(
                                                (user) => (
                                                    <tr
                                                        key={user._id}
                                                    >
                                                        <td>
                                                            {user.name}
                                                        </td>

                                                        <td>
                                                            {user.email}
                                                        </td>

                                                        <td>
                                                            <span className="badge bg-secondary">
                                                                {user.role}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`badge ${
                                                                    user.status ===
                                                                    "active"
                                                                        ? "bg-success"
                                                                        : "bg-danger"
                                                                }`}
                                                            >
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </div>

                </div>

                {/* Quick Actions */}
                <div className="col-lg-4">

                    <div className="card shadow-sm">

                        <div className="card-header bg-white">
                            <h5 className="mb-0">
                                Quick Actions
                            </h5>
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

                                <strong>
                                    {stats.normalUsers}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Dashboard;