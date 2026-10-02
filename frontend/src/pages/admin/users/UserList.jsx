import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import userService from "../../../services/userService";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import EmptyState from "../../../components/common/EmptyState";
import { USER_STATUS } from "../../../constants/userConstants";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useAuth } from "../../../context/AuthContext";

const initialPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
};

const UserList = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);

    const fetchUsers = async (page = 1, searchValue = search) => {
        setLoading(true);
        setError("");

        try {
            const response = await userService.getUsers({
                page,
                limit: 10,
                search: searchValue.trim()
            });

            setUsers(response.data.data || []);
            setPagination(response.data.pagination || initialPagination);
        } catch (error) {
            setError(getApiErrorMessage(error, "Failed to load users"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1, "");
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();
        fetchUsers(1, search);
    };

    const handleClearSearch = () => {
        setSearch("");
        fetchUsers(1, "");
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus =
            currentStatus === USER_STATUS.ACTIVE
                ? USER_STATUS.INACTIVE
                : USER_STATUS.ACTIVE;

        setStatusUpdatingId(userId);
        setError("");

        try {
            await userService.updateStatus(userId, newStatus);
            toast.success(`User ${newStatus} successfully`);
            await fetchUsers(pagination.page, search);
        } catch (error) {
            setError(
                getApiErrorMessage(
                    error,
                    "Failed to update user status"
                )
            );
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        setDeletingId(userId);
        setError("");

        try {
            await userService.deleteUser(userId);
            toast.success("User deleted successfully");

            const nextPage =
                users.length === 1 && pagination.page > 1
                    ? pagination.page - 1
                    : pagination.page;

            await fetchUsers(nextPage, search);
        } catch (error) {
            setError(getApiErrorMessage(error, "Failed to delete user"));
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Users</h2>
                    <p className="text-muted mb-0">
                        Manage application users
                    </p>
                </div>

                <Link to="/admin/users/create" className="btn btn-primary">
                    + Add User
                </Link>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <form onSubmit={handleSearch} className="row g-2">
                        <div className="col-md-8">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <div className="col-md-auto">
                            <button type="submit" className="btn btn-primary">
                                Search
                            </button>
                        </div>

                        <div className="col-md-auto">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleClearSearch}
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card shadow-sm">
                <div className="card-body p-0">
                    {loading ? (
                        <LoadingSpinner message="Loading users..." />
                    ) : users.length === 0 ? (
                        <EmptyState message="No users found" />
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user, index) => {
                                        const isSelf =
                                            currentUser?.id?.toString() ===
                                            user.id?.toString();

                                        return (
                                            <tr key={user.id}>
                                                <td>
                                                    {(pagination.page - 1) *
                                                        pagination.limit +
                                                        index +
                                                        1}
                                                </td>
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
                                                <td>
                                                    {user.createdAt
                                                        ? new Date(
                                                              user.createdAt
                                                          ).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Link
                                                            to={`/admin/users/${user.id}/edit`}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            Edit
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-warning"
                                                            disabled={
                                                                isSelf ||
                                                                statusUpdatingId === user.id
                                                            }
                                                            onClick={() =>
                                                                handleStatusToggle(
                                                                    user.id,
                                                                    user.status
                                                                )
                                                            }
                                                        >
                                                            {statusUpdatingId === user.id
                                                                ? "Updating..."
                                                                : user.status === USER_STATUS.ACTIVE
                                                                  ? "Deactivate"
                                                                  : "Activate"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={
                                                                isSelf ||
                                                                deletingId === user.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(user.id)
                                                            }
                                                        >
                                                            {deletingId === user.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && pagination.total > 0 && (
                    <div className="card-footer d-flex justify-content-between align-items-center">
                        <span className="text-muted">
                            Total Users: {pagination.total}
                        </span>

                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                disabled={!pagination.hasPreviousPage}
                                onClick={() =>
                                    fetchUsers(pagination.page - 1, search)
                                }
                            >
                                Previous
                            </button>

                            <span>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                disabled={!pagination.hasNextPage}
                                onClick={() =>
                                    fetchUsers(pagination.page + 1, search)
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;
