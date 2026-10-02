import api from "../api/axios";

const getStats = () => api.get("/dashboard/stats");

export default {
    getStats
};
