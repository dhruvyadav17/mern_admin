import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../../api/axios";
import toast from "react-hot-toast";

const UserList = () => {
    const [users, setUsers] = useState([]);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const fetchUsers = async (
        page = 1,
        searchValue = search
    ) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/users", {
                params: {
                    page,
                    limit: 10,
                    search: searchValue
                }
            });

            setUsers(response.data.data);
            setPagination(response.data.pagination);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to load users"
            );
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

    const handlePreviousPage = () => {
        if (pagination.hasPreviousPage) {
            fetchUsers(
                pagination.page - 1,
                search
            );
        }
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) {
            fetchUsers(
                pagination.page + 1,
                search
            );
        }
    };

    const handleStatusToggle = async (
        userId,
        currentStatus
    ) => {
        const newStatus =
            currentStatus === "active"
                ? "inactive"
                : "active";

        setError("");

        try {
            await api.patch(
                `/users/${userId}/status`,
                {
                    status: newStatus
                }
            );
            toast.success(
                `User ${newStatus} successfully`
            );
            await fetchUsers(
                pagination.page,
                search
            );

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to update user status"
            );
        }
    };

    const handleDelete = async (userId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this user?"
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(userId);
        setError("");

        try {
            await api.delete(
                `/users/${userId}`
            );
            toast.success("User deleted successfully");
            await fetchUsers(
                pagination.page,
                search
            );

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to delete user"
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="mb-1">
                        Users
                    </h2>

                    <p className="text-muted mb-0">
                        Manage application users
                    </p>
                </div>

                <Link
                    to="/admin/users/create"
                    className="btn btn-primary"
                >
                    + Add User
                </Link>

            </div>

            {/* Search */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">

                    <form
                        onSubmit={handleSearch}
                        className="row g-2"
                    >

                        <div className="col-md-8">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>

                        <div className="col-md-auto">
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
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

            {/* Error */}
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div className="card shadow-sm">

                <div className="card-body p-0">

                    {loading ? (
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
                                Loading users...
                            </div>

                        </div>
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

                                    {users.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="text-center py-4 text-muted"
                                            >
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map(
                                            (user, index) => (
                                                <tr
                                                    key={user._id}
                                                >
                                                    <td>
                                                        {(
                                                            pagination.page -
                                                            1
                                                        ) *
                                                            pagination.limit +
                                                            index +
                                                            1}
                                                    </td>

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
                                                        <div className="d-flex align-items-center gap-2">

                                                            <span
                                                                className={`badge ${
                                                                    user.status === "active"
                                                                        ? "bg-success"
                                                                        : "bg-danger"
                                                                }`}
                                                            >
                                                                {user.status}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                className={`btn btn-sm ${
                                                                    user.status === "active"
                                                                        ? "btn-outline-danger"
                                                                        : "btn-outline-success"
                                                                }`}
                                                                onClick={() =>
                                                                    handleStatusToggle(
                                                                        user._id,
                                                                        user.status
                                                                    )
                                                                }
                                                            >
                                                                {user.status === "active"
                                                                    ? "Deactivate"
                                                                    : "Activate"}
                                                            </button>

                                                        </div>
                                                    </td>

                                                    <td>
                                                        {new Date(
                                                            user.createdAt
                                                        ).toLocaleDateString()}
                                                    </td>

                                                    <td>
                                                        <div className="d-flex gap-2">

                                                            <Link
                                                                to={`/admin/users/${user._id}/edit`}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                Edit
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    deletingId ===
                                                                    user._id
                                                                }
                                                            >
                                                                {deletingId ===
                                                                user._id
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </button>

                                                        </div>
                                                    </td>

                                                </tr>
                                            )
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* Pagination */}
                {!loading &&
                    users.length > 0 && (
                        <div className="card-footer d-flex justify-content-between align-items-center">

                            <span className="text-muted">
                                Total Users:{" "}
                                {pagination.total}
                            </span>

                            <div className="d-flex align-items-center gap-2">

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={
                                        handlePreviousPage
                                    }
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                >
                                    Previous
                                </button>

                                <span>
                                    Page{" "}
                                    {pagination.page}{" "}
                                    of{" "}
                                    {pagination.totalPages}
                                </span>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={
                                        handleNextPage
                                    }
                                    disabled={
                                        !pagination.hasNextPage
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