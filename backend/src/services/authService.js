const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");

const registerUser = async ({
    name,
    email,
    password
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
        role: "user",
        status: "active"
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
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    });

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const isPasswordValid = await bcrypt.compare(
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