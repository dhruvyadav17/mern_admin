import api from "../api/axios";
export const getSettings = () => api.get("/settings");
export const updateSettings = (data) => api.put("/settings", data);
