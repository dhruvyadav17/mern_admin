import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import UserForm from "../../../components/users/UserForm";
import {
    USER_ROLES,
    USER_STATUS
} from "../../../constants/userConstants";
import userService from "../../../services/userService";
import { getApiErrorMessage } from "../../../utils/apiError";

const initialValues = {
    name: "",
    email: "",
    password: "",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE
};

const UserCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (data) => {
        setLoading(true);
        setError("");

        try {
            await userService.createUser(data);
            toast.success("User created successfully");
            navigate("/admin/users");
        } catch (error) {
            setError(
                getApiErrorMessage(error, "Failed to create user")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Create User</h2>
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

            <div className="card shadow-sm">
                <div className="card-body">
                    <UserForm
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        submitting={loading}
                        error={error}
                        submitLabel="Create User"
                    />
                </div>
            </div>
        </div>
    );
};

export default UserCreate;
