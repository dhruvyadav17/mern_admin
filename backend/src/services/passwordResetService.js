const crypto = require("crypto");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { hashPassword } = require("../utils/password");
const AppError = require("../utils/AppError");
const { sendPasswordResetEmail } = require("./emailService");

const genericMessage = "If the account exists, password reset instructions have been sent.";

const requestReset = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return { message: genericMessage };

    await PasswordResetToken.deleteMany({ userId: user._id });
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) });

    if (process.env.NODE_ENV === "production") {
        try {
            await sendPasswordResetEmail({ to: user.email, name: user.name, token: raw });
        } catch (error) {
            await PasswordResetToken.deleteOne({ tokenHash });
            throw new AppError("Password reset email service is not configured", 503);
        }
        return { message: genericMessage };
    }

    return { message: genericMessage, resetToken: raw };
};

const resetPassword = async (rawToken, password) => {
    if (!rawToken) throw new AppError("Reset token is required", 400);
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const record = await PasswordResetToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!record) throw new AppError("Reset token is invalid or expired", 400);
    const user = await User.findById(record.userId);
    if (!user) throw new AppError("User not found", 404);
    user.password = await hashPassword(password);
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    await PasswordResetToken.deleteMany({ userId: user._id });
};

module.exports = { requestReset, resetPassword };
