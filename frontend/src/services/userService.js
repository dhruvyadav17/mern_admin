import api from "../api/axios";

const getUsers = (params) => api.get("/users", { params });

const getUser = (id) => api.get(`/users/${id}`);

const createUser = (data) => api.post("/users", data);

const updateUser = (id, data) => api.patch(`/users/${id}`, data);

const deleteUser = (id) => api.delete(`/users/${id}`);

const getActivity = (id, params) =>
  api.get(`/users/${id}/activity`, { params });

const exportUsers = () => api.get("/users/export", { responseType: "blob" });
const bulkStatusAction = (payload) => {
  return api.patch("/users/bulk/status", payload);
};

const bulkDelete = (userIds) => {
  return api.delete("/users/bulk", {
    data: {
      userIds,
    },
  });
};

const updateStatus = (id, status) =>
  api.patch(`/users/${id}/status`, { status });

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateStatus,
  getActivity,
  exportUsers,
  bulkStatusAction,
  bulkDelete,
};
