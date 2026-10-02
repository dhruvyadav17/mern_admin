import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import userService from "../../../services/userService";
import toast from "react-hot-toast";
import { USER_ROLES, USER_STATUS } from "../../../constants/userConstants";

const UserCreate = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await userService.createUser(formData); 
            toast.success("User created successfully");
            navigate("/admin/users");

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to create user"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="mb-1">
                        Create User
                    </h2>

                    <p className="text-muted mb-0">
                        Add a new application user
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
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                value={formData.password}
                                onChange={handleChange}
                                minLength="6"
                                required
                            />
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
                                <option value= {USER_ROLES.USER}>
                                    User
                                </option>

                                <option value={USER_ROLES.ADMIN}>
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
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating..."
                                    : "Create User"}
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

export default UserCreate;