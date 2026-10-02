const dashboardService = require("../services/dashboardService");
const { successResponse } = require("../utils/response");

const getDashboardStats = async (req, res) => {
    const stats = await dashboardService.getDashboardStats();

    return successResponse(
        res,
        stats,
        "Stats fetched successfully"
    );
};

module.exports = {
    getDashboardStats
};
