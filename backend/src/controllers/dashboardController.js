const dashboardService = require("../services/dashboardService");

const getDashboardStats = async (req, res) => {
    const stats =
        await dashboardService.getDashboardStats();

    return res.status(200).json({
        success: true,
        data: stats
    });
};

module.exports = {
    getDashboardStats
};