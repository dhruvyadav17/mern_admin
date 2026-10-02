const mongoose = require("mongoose");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");
const { hashPassword } = require("../utils/password");
const { toUserResponse, toUserListResponse } = require("../utils/userMapper");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

const validateUserId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid user ID", 400);
    }
};

const ensureActiveAdminWillRemain = async (excludeUserId) => {
    const activeAdminCount = await User.countDocuments({
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {})
    });

    if (activeAdminCount === 0) {
        throw new AppError(
            "At least one active admin is required",
            400
        );
    }
};

const getUsers = async ({ page = 1, limit = 10, search = "" }) => {
    const pagination = getPagination(page, limit);
    const trimmedSearch = String(search || "").trim();
    const filter = {};

    if (trimmedSearch) {
        const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { name: { $regex: safeSearch, $options: "i" } },
            { email: { $regex: safeSearch, $options: "i" } }
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit),
        User.countDocuments(filter)
    ]);

    return {
        users: toUserListResponse(users),
        pagination: getPaginationMeta(
            total,
            pagination.page,
            pagination.limit
        )
    };
};

const createUser = async ({
    name,
    email,
    password,
    role = USER_ROLES.USER,
    status = USER_STATUS.ACTIVE
}) => {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: await hashPassword(password),
        role,
        status
    });

    return toUserResponse(user);
};

const getUserById = async (id) => {
    validateUserId(id);

    const user = await User.findById(id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return toUserResponse(user);
};

const updateUser = async (id, data, currentUserId) => {
    validateUserId(id);

    const user = await User.findById(id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isSelf = user._id.toString() === currentUserId.toString();
    const isActiveAdmin =
        user.role === USER_ROLES.ADMIN &&
        user.status === USER_STATUS.ACTIVE;

    if (isSelf && (data.role !== undefined || data.status !== undefined)) {
        throw new AppError(
            "You cannot change your own role or status",
            400
        );
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
        const normalizedEmail = data.email.toLowerCase();
        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: user._id }
        });

        if (existingUser) {
            throw new AppError("Email already registered", 409);
        }

        user.email = normalizedEmail;
    }

    if (data.name !== undefined) {
        user.name = data.name;
    }

    if (
        isActiveAdmin &&
        data.role !== undefined &&
        data.role !== USER_ROLES.ADMIN
    ) {
        await ensureActiveAdminWillRemain(user._id);
    }

    if (
        isActiveAdmin &&
        data.status === USER_STATUS.INACTIVE
    ) {
        await ensureActiveAdminWillRemain(user._id);
    }

    if (data.role !== undefined) {
        user.role = data.role;
    }

    if (data.status !== undefined) {
        user.status = data.status;
    }

    if (data.password) {
        user.password = await hashPassword(data.password);
    }

    await user.save();

    return toUserResponse(user);
};

const deleteUser = async (id, currentUserId) => {
    validateUserId(id);

    const user = await User.findById(id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user._id.toString() === currentUserId.toString()) {
        throw new AppError("You cannot delete your own account", 400);
    }

    if (
        user.role === USER_ROLES.ADMIN &&
        user.status === USER_STATUS.ACTIVE
    ) {
        await ensureActiveAdminWillRemain(user._id);
    }

    await user.deleteOne();
};

const updateUserStatus = async (id, status, currentUserId) => {
    validateUserId(id);

    const user = await User.findById(id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user._id.toString() === currentUserId.toString()) {
        throw new AppError("You cannot change your own status", 400);
    }

    if (
        user.role === USER_ROLES.ADMIN &&
        user.status === USER_STATUS.ACTIVE &&
        status === USER_STATUS.INACTIVE
    ) {
        await ensureActiveAdminWillRemain(user._id);
    }

    user.status = status;
    await user.save();

    return toUserResponse(user);
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus
};
