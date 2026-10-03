import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/logout",
    "/auth/me"
];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || "";
        const isAuthRequest = authRoutes.some((route) =>
            requestUrl.includes(route)
        );

        if (
            error.response?.status === 401 &&
            !isAuthRequest
        ) {
            window.location.replace("/login");
        }

        return Promise.reject(error);
    }
);

export default api;
