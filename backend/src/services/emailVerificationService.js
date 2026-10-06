const crypto = require("crypto");
const User = require("../models/User");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const AppError = require("../utils/AppError");
const settingsService = require("./settingsService");
const { sendEmailVerificationEmail } = require("./emailService");

const genericMessage = "If verification is required, instructions have been sent.";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const createVerificationToken = async (user) => {
    await EmailVerificationToken.deleteMany({ userId: user._id });
    const raw = crypto.randomBytes(32).toString("hex");
    await EmailVerificationToken.create({
        userId: user._id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
    });
    return raw;
};

const sendVerification = async (user, token) => {
    if (process.env.NODE_ENV === "production") {
        await sendEmailVerificationEmail({
            to: user.email,
            name: user.name,
            token
        });
        return { message: genericMessage };
    }

    return { message: genericMessage, verificationToken: token };
};

const requestVerificationForUser = async (user) => {
    if (!await settingsService.getValue("registration.email_verification", false)) {
        return { message: genericMessage };
    }

    if (!user || user.emailVerifiedAt) {
        return { message: genericMessage };
    }

    const token = await createVerificationToken(user);
    return sendVerification(user, token);
};

const requestVerification = async (email) => {
    const user = await User.findOne({ email: String(email || "").toLowerCase() });
    return requestVerificationForUser(user);
};

const verify = async (rawToken) => {
    if (!rawToken) throw new AppError("Verification token is required", 400);

    const record = await EmailVerificationToken.findOne({
        tokenHash: hashToken(rawToken),
        expiresAt: { $gt: new Date() }
    });

    if (!record) {
        throw new AppError("Verification token is invalid or expired", 400);
    }

    const user = await User.findById(record.userId);
    if (!user) throw new AppError("User not found", 404);

    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    await user.save();
    await EmailVerificationToken.deleteMany({ userId: user._id });
};

module.exports = {
    requestVerification,
    requestVerificationForUser,
    verify,
    createVerificationToken
};

