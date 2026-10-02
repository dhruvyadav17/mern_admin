import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    USER_ROLES,
    USER_STATUS
} from "../../constants/userConstants";

const UserForm = ({
    initialValues,
    onSubmit,
    submitting = false,
    error = "",
    isEdit = false,
    disableRoleStatus = false,
    cancelTo = "/admin/users",
    submitLabel = "Save User"
}) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE
    });

    useEffect(() => {
        setFormData({
            name: initialValues?.name || "",
            email: initialValues?.email || "",
            password: "",
            role: initialValues?.role || USER_ROLES.USER,
            status: initialValues?.status || USER_STATUS.ACTIVE
        });
    }, [
        initialValues?.name,
        initialValues?.email,
        initialValues?.role,
        initialValues?.status
    ]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">
                    {isEdit ? "New Password" : "Password"}
                </label>
                <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    required={!isEdit}
                />
                {isEdit && (
                    <div className="form-text">
                        Leave blank to keep the current password.
                    </div>
                )}
            </div>

            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Role</label>
                    <select
                        name="role"
                        className="form-select"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={disableRoleStatus}
                    >
                        <option value={USER_ROLES.USER}>User</option>
                        <option value={USER_ROLES.ADMIN}>Admin</option>
                    </select>
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={disableRoleStatus}
                    >
                        <option value={USER_STATUS.ACTIVE}>Active</option>
                        <option value={USER_STATUS.INACTIVE}>Inactive</option>
                    </select>
                </div>
            </div>

            <div className="d-flex gap-2">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? "Saving..." : submitLabel}
                </button>

                <Link to={cancelTo} className="btn btn-secondary">
                    Cancel
                </Link>
            </div>
        </form>
    );
};

export default UserForm;
