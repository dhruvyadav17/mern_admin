import api from "../api/axios";

const login = (data) => api.post("/auth/login", data);
const register = (data) => api.post("/auth/register", data);
const getMe = () => api.get("/auth/me");
const logout = () => api.post("/auth/logout");

export default {
    login,
    register,
    getMe,
    logout
};
