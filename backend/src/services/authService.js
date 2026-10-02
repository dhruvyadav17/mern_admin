const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");
const { hashPassword, comparePassword } = require("../utils/password");
const { toUserResponse } = require("../utils/userMapper");

const registerUser = async ({ name, email, password }) => {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: await hashPassword(password),
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE
    });

    return toUserResponse(user);
};

const loginUser = async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    }).select("+password");

    if (!user || !(await comparePassword(password, user.password))) {
        throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
        throw new AppError("Your account is inactive", 403);
    }

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return {
        token,
        user: toUserResponse(user)
    };
};

module.exports = {
    registerUser,
    loginUser
};
