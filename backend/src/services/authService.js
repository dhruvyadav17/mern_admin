const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const {
    USER_ROLES,
    USER_STATUS
} = require("../constants/userConstants");

const {
    hashPassword,
    comparePassword
} = require("../utils/password");

const registerUser = async ({
    name,
    email,
    password
}) => {
    const normalizedEmail =
        email.toLowerCase();

    const existingUser =
        await User.findOne({
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
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE
    });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
    };
};

const loginUser = async ({
    email,
    password
}) => {
    const normalizedEmail =
        email.toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    });

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const isPasswordValid =
        await comparePassword(
            password,
            user.password
        );

    if (!isPasswordValid) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    if (user.status !== "active") {
        throw new AppError(
            "Your account is inactive",
            403
        );
    }

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    };
};

module.exports = {
    registerUser,
    loginUser
};