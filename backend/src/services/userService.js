const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const AppError = require("../utils/AppError");

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
        filter.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                email: {
                    $regex: search,
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
    role = "user",
    status = "active"
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

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            "Invalid user ID",
            400
        );
    }

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

const updateUser = async (id, data) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            "Invalid user ID",
            400
        );
    }

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

    if (name) {
        user.name = name;
    }

    if (role) {
        user.role = role;
    }

    if (status) {
        user.status = status;
    }

    if (password) {
        user.password = await bcrypt.hash(
            password,
            10
        );
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            "Invalid user ID",
            400
        );
    }

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

    await User.findByIdAndDelete(id);
};

const updateUserStatus = async (
    id,
    status,
    currentUserId
) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            "Invalid user ID",
            400
        );
    }

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

    user.status = status;

    await user.save();

    return {
        id: user._id,
        name: user.name,
        email: user.email,
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