import api from "../api/axios";

const login = (data) => {
    return api.post(
        "/auth/login",
        data
    );
};

const register = (data) => {
    return api.post(
        "/auth/register",
        data
    );
};

const getMe = () => {
    return api.get("/auth/me");
};

const logout = () => {
    return api.post("/auth/logout");
};

export default {
    login,
    register,
    getMe,
    logout
};