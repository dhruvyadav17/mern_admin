import api from "../api/axios";

const getUsers = (params) => api.get("/users", { params });

const getUser = (id) => api.get(`/users/${id}`);

const createUser = (data) => api.post("/users", data);

const updateUser = (id, data) => api.put(`/users/${id}`, data);

const deleteUser = (id) => api.delete(`/users/${id}`);

const updateStatus = (id, status) =>
    api.patch(`/users/${id}/status`, { status });

export default {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateStatus
};
