import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import UserForm from "../../../components/users/UserForm";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import userService from "../../../services/userService";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useAuth } from "../../../context/AuthContext";

const UserEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await userService.getUser(id);
                setUser(response.data.data);
            } catch (error) {
                setError(getApiErrorMessage(error, "Failed to load user"));
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    const handleSubmit = async (data) => {
        setSaving(true);
        setError("");

        try {
            const updateData = {
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status
            };

            if (data.password) {
                updateData.password = data.password;
            }

            await userService.updateUser(id, updateData);
            navigate("/admin/users");
        } catch (error) {
            setError(getApiErrorMessage(error, "Failed to update user"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading user..." />;
    }

    if (!user) {
        return (
            <div>
                <div className="alert alert-danger">{error || "User not found"}</div>
                <Link to="/admin/users" className="btn btn-secondary">
                    Back to Users
                </Link>
            </div>
        );
    }

    const isSelf = currentUser?.id?.toString() === user.id?.toString();

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Edit User</h2>
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

            <div className="card shadow-sm">
                <div className="card-body">
                    <UserForm
                        initialValues={user}
                        onSubmit={handleSubmit}
                        submitting={saving}
                        error={error}
                        isEdit
                        disableRoleStatus={isSelf}
                        submitLabel="Update User"
                    />
                </div>
            </div>
        </div>
    );
};

export default UserEdit;
