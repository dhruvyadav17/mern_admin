const User = require("../models/User");
const Role = require("../models/Role");
const AuditLog = require("../models/AuditLog");
const { USER_ROLES, USER_STATUS } = require("../constants/userConstants");
const getDashboardStats = async () => {
    const [totalUsers, activeUsers, inactiveUsers, suspendedUsers, adminUsers, roles, recentActivity, userGrowth] = await Promise.all([
        User.countDocuments(), User.countDocuments({ status: USER_STATUS.ACTIVE }), User.countDocuments({ status: USER_STATUS.INACTIVE }), User.countDocuments({ status: { $nin: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE] } }), User.countDocuments({ roles: USER_ROLES.ADMIN }), Role.countDocuments(), AuditLog.find().populate("actorId", "name email").sort({ createdAt: -1 }).limit(8).lean(),
        User.aggregate([{ $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    ]);
    const roleDistribution = await User.aggregate([{ $unwind: "$roles" }, { $group: { _id: "$roles", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]);
    return { totalUsers, activeUsers, inactiveUsers, suspendedUsers, adminUsers, roles, recentActivity, userGrowth, roleDistribution };
};
module.exports = { getDashboardStats };
