const mongoose = require("mongoose");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");
const {
    hashPassword
} = require("../utils/password");

const validateUserId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            "Invalid user ID",
            400
        );
    }
};

const ensureAnotherActiveAdminExists = async () => {
    const adminCount = await User.countDocuments({
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE
    });

    if (adminCount <= 1) {
        throw new AppError(
            "At least one active admin is required",
            400
        );
    }
};

const getUsers = async ({
    page = 1,
    limit = 10,
    search = ""
}) => {
    page = Math.max(parseInt(page) || 1, 1);

    limit = Math.min(
        Math.max(parseInt(limit) || 10, 1),
        100
    );

    search = search.trim();

    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
        const safeSearch = search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filter.$or = [
            {
                name: {
                    $regex: safeSearch,
                    $options: "i"
                }
            },
            {
                email: {
                    $regex: safeSearch,
                    $options: "i"
                }
            }
        ];
    }

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(
        total / limit
    );

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
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

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new AppError(
            "Email already registered",
            409
        );
    }

    const hashedPassword =
        await hashPassword(password);

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        status
    });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
    };
};

const getUserById = async (id) => {
    validateUserId(id);

    const user = await User.findById(id)
        .select("-password");

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    return user;
};

const updateUser = async (
    id,
    data,
    currentUserId
) => {
    validateUserId(id);

    const {
        name,
        email,
        password,
        role,
        status
    } = data;

    const user = await User.findById(id);

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    const isSelf =
        user._id.toString() ===
        currentUserId.toString();

    if (isSelf && role !== undefined) {
        throw new AppError(
            "You cannot change your own role",
            400
        );
    }

    if (isSelf && status !== undefined) {
        throw new AppError(
            "You cannot change your own status",
            400
        );
    }

    if (
        email &&
        email.toLowerCase() !== user.email
    ) {
        const normalizedEmail =
            email.toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: {
                $ne: user._id
            }
        });

        if (existingUser) {
            throw new AppError(
                "Email already registered",
                409
            );
        }

        user.email = normalizedEmail;
    }

    if (name !== undefined) {
        user.name = name;
    }

    if (role !== undefined) {
        if (
            user.role === USER_ROLES.ADMIN &&
            role !== USER_ROLES.ADMIN
        ) {
            const adminCount =
                await User.countDocuments({
                    role: USER_ROLES.ADMIN,
                    status: USER_STATUS.ACTIVE
                });

            if (adminCount <= 1) {
                throw new AppError(
                    "At least one active admin is required",
                    400
                );
            }
        }

        user.role = role;
    }

    if (status !== undefined) {
        if (
            user.role === USER_ROLES.ADMIN &&
            status === USER_STATUS.INACTIVE
        ) {
            const adminCount =
                await User.countDocuments({
                    role: USER_ROLES.ADMIN,
                    status: USER_STATUS.ACTIVE
                });

            if (adminCount <= 1) {
                throw new AppError(
                    "At least one active admin is required",
                    400
                );
            }
        }

        user.status = status;
    }

    if (password) {
        user.password =
            await hashPassword(password);
    }

    await user.save();

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        updatedAt: user.updatedAt
    };
};

const deleteUser = async (
    id,
    currentUserId
) => {
    validateUserId(id);

    const user = await User.findById(id);

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    if (
        user._id.toString() ===
        currentUserId.toString()
    ) {
        throw new AppError(
            "You cannot delete your own account",
            400
        );
    }

    if (user.role === USER_ROLES.ADMIN) {
        // const adminCount =
        //     await User.countDocuments({
        //         role: USER_ROLES.ADMIN,
        //         status: USER_STATUS.ACTIVE
        //     });

        // if (adminCount <= 1) {
        //     throw new AppError(
        //         "At least one active admin is required",
        //         400
        //     );
        // }
        await ensureAnotherActiveAdminExists();

    }

    await User.findByIdAndDelete(id);
};

const updateUserStatus = async (
    id,
    status,
    currentUserId
) => {
    validateUserId(id);

    const user = await User.findById(id);

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    if (
        user._id.toString() ===
        currentUserId.toString()
    ) {
        throw new AppError(
            "You cannot change your own status",
            400
        );
    }

    if (
        user.role ===  USER_ROLES.ADMIN &&
        status === USER_STATUS.INACTIVE
    ) {
        const adminCount =
            await User.countDocuments({
                role: USER_ROLES.ADMIN,
                status: USER_STATUS.ACTIVE
            });

        if (adminCount <= 1) {
            throw new AppError(
                "At least one active admin is required",
                400
            );
        }
    }

    user.status = status;

    await user.save();

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
    };
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateUserStatus
};