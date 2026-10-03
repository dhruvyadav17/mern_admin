import api from "../api/axios";
const login = (data) => api.post("/auth/login", data);
const register = (data) => api.post("/auth/register", data);
const getMe = () => api.get("/auth/me");
const logout = () => api.post("/auth/logout");
const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
const resetPassword = (data) => api.post("/auth/reset-password", data);
const verifyEmail = (token) => api.post("/auth/verify-email", { token });
const resendVerification = (email) => api.post("/auth/resend-verification", { email });
const changePassword = (data) => api.put("/auth/change-password", data);
const updateProfile = (data) => api.put("/auth/profile", data);
export default {
    login,
    register,
    getMe,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    changePassword,
    updateProfile
};
