import api from "../api/axios";

export const getAuditLogs = (params = {}) => {
  return api.get("/audit-logs", {
    params,
  });
};

export const exportAuditLogs = (params = {}) => {
  return api.get("/audit-logs/export", {
    params,
    responseType: "blob",
  });
};
