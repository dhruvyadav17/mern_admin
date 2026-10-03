import api from "../api/axios";
export const getPublicSettings = () => api.get("/settings/public");
export const getSettings = () => api.get("/settings");
export const updateSettings = (data) => api.put("/settings", data);
