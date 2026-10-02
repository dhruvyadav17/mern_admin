const User = require("../models/User");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");

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
            status: USER_STATUS.ACTIVE
        }),

        User.countDocuments({
            status: USER_STATUS.INACTIVE
        }),

        User.countDocuments({
            role: USER_ROLES.ADMIN
        }),

        User.countDocuments({
            role: USER_ROLES.USER
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
