import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfToken = "";
let csrfRequest = null;

const unsafeMethods = new Set(["post", "put", "patch", "delete"]);

const fetchCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = api
      .get("/auth/csrf", { skipCsrf: true })
      .then((response) => response.data?.data?.csrfToken || "")
      .finally(() => {
        csrfRequest = null;
      });
  }
  csrfToken = await csrfRequest;
  return csrfToken;
};

api.interceptors.request.use(async (config) => {
  if (
    !config.skipCsrf &&
    unsafeMethods.has(String(config.method || "get").toLowerCase())
  ) {
    const token = await fetchCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = token;
    }
  }

  return config;
});

const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/me",
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (
      error.response?.status === 403 &&
      error.response?.data?.message === "Invalid CSRF token" &&
      !originalRequest._csrfRetry
    ) {
      csrfToken = "";
      originalRequest._csrfRetry = true;
      const token = await fetchCsrfToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers["X-CSRF-Token"] = token;
      return api(originalRequest);
    }

    const requestUrl = error.config?.url || "";
    const isAuthRequest = authRoutes.some((route) =>
      requestUrl.includes(route),
    );

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      window.location.pathname !== "/login"
    ) {
      window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);

export default api;
