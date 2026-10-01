import api from "../api/axios";

const getStats = () => {
    return api.get(
        "/dashboard/stats"
    );
};

export default {
    getStats
};