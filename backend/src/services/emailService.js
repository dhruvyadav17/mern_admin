const AppError = require("../utils/AppError");

const sendPasswordResetEmail = async ({ to, name, token }) => {
    const endpoint = process.env.EMAIL_API_URL;
    const apiKey = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!endpoint || !apiKey || !from) throw new AppError("Password reset email service is not configured", 503);
    const baseUrl = String(process.env.PASSWORD_RESET_URL || process.env.CLIENT_URL || "").replace(/\/$/, "");
    const url = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            from, to,
            subject: "Reset your password",
            text: `Hello ${name || "User"},\n\nReset your password here (expires in 30 minutes): ${url}`,
            html: `<p>Hello ${name || "User"},</p><p><a href="${url}">Reset your password</a></p><p>This link expires in 30 minutes.</p>`
        })
    });
    if (!response.ok) throw new AppError("Password reset email could not be sent", 503);
};

const sendEmailVerificationEmail = async ({ to, name, token }) => {
    const endpoint = process.env.EMAIL_API_URL;
    const apiKey = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!endpoint || !apiKey || !from) {
        throw new AppError("Email verification service is not configured", 503);
    }

    const baseUrl = String(process.env.EMAIL_VERIFICATION_URL || process.env.CLIENT_URL || "").replace(/\/$/, "");
    const url = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            from,
            to,
            subject: "Verify your email",
            text: `Hello ${name || "User"},\n\nVerify your email here (expires in 24 hours): ${url}`,
            html: `<p>Hello ${name || "User"},</p><p><a href="${url}">Verify your email</a></p><p>This link expires in 24 hours.</p>`
        })
    });

    if (!response.ok) {
        throw new AppError("Verification email could not be sent", 503);
    }
};

module.exports = { sendPasswordResetEmail, sendEmailVerificationEmail };

