import api from "../api/axios";
export const globalSearch = (q) => api.get("/search", { params: { q } });
