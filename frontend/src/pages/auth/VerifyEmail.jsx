import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import authService from "../../services/authService";
import { AuthBox } from "./Login";

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const [email, setEmail] = useState("");
    const [token, setToken] = useState(params.get("token") || "");
    const [developmentToken, setDevelopmentToken] = useState("");

    const verify = async (event) => {
        event.preventDefault();
        try {
            await authService.verifyEmail(token);
            toast.success("Email verified successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
        }
    };

    const resend = async (event) => {
        event.preventDefault();
        try {
            const response = await authService.resendVerification(email);
            toast.success(response.data.message);
            setDevelopmentToken(response.data.data?.verificationToken || "");
        } catch (error) {
            toast.error(error.response?.data?.message || "Request failed");
        }
    };

    return (
        <AuthBox title="Verify email">
            <form onSubmit={verify}>
                <input
                    className="form-control mb-3"
                    placeholder="Verification token"
                    required
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                />
                <button className="btn btn-primary w-100">
                    Verify email
                </button>
            </form>
            <hr />
            <form onSubmit={resend}>
                <input
                    className="form-control mb-3"
                    type="email"
                    placeholder="Account email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <button className="btn btn-outline-primary w-100">
                    Resend verification
                </button>
            </form>
            {developmentToken && (
                <div className="alert alert-warning mt-3 small">
                    Development verification token:
                    <br />
                    <code className="text-break">{developmentToken}</code>
                </div>
            )}
            <div className="text-center mt-3">
                <Link to="/login">Back to login</Link>
            </div>
        </AuthBox>
    );
}
