import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../../../api/axios";
import toast from "react-hot-toast";

const UserEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        status: "active"
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchUser = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                `/users/${id}`
            );

            const user = response.data.data;

            setFormData({
                name: user.name,
                email: user.email,
                password: "",
                role: user.role,
                status: user.status
            });

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to load user"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [id]);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSaving(true);

        try {
            const updateData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                status: formData.status
            };

            // Password only send when user entered a new password
            if (formData.password) {
                updateData.password = formData.password;
            }

            await api.put(
                `/users/${id}`,
                updateData
            );
            toast.success("User updated successfully");
            navigate("/admin/users");

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to update user"
            );
        } finally {
            setSaving(false);
        }
    };

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
                    Loading user...
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
                        Edit User
                    </h2>

                    <p className="text-muted mb-0">
                        Update user information
                    </p>
                </div>

                <Link
                    to="/admin/users"
                    className="btn btn-outline-secondary"
                >
                    Back to Users
                </Link>

            </div>

            {/* Form */}
            <div className="card shadow-sm">

                <div className="card-body">

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* Name */}
                        <div className="mb-3">
                            <label className="form-label">
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-3">
                            <label className="form-label">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <label className="form-label">
                                New Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                value={formData.password}
                                onChange={handleChange}
                                minLength="6"
                            />

                            <div className="form-text">
                                Leave blank if you do not want to
                                change the password.
                            </div>
                        </div>

                        {/* Role */}
                        <div className="mb-3">
                            <label className="form-label">
                                Role
                            </label>

                            <select
                                name="role"
                                className="form-select"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="user">
                                    User
                                </option>

                                <option value="admin">
                                    Admin
                                </option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className="mb-4">
                            <label className="form-label">
                                Status
                            </label>

                            <select
                                name="status"
                                className="form-select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="d-flex gap-2">

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Updating..."
                                    : "Update User"}
                            </button>

                            <Link
                                to="/admin/users"
                                className="btn btn-secondary"
                            >
                                Cancel
                            </Link>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
};

export default UserEdit;