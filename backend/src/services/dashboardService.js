const User = require("../models/User");

const getDashboardStats = async () => {
    const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        normalUsers
    ] = await Promise.all([
        User.countDocuments(),

        User.countDocuments({
            status: "active"
        }),

        User.countDocuments({
            status: "inactive"
        }),

        User.countDocuments({
            role: "admin"
        }),

        User.countDocuments({
            role: "user"
        })
    ]);

    return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        normalUsers
    };
};

module.exports = {
    getDashboardStats
};