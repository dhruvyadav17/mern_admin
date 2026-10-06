const dotenv = require("dotenv");

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];

const validateEnv = () => {
    const missing = required.filter((name) => !process.env[name]);

    if (missing.length) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }

    try {
        process.env.CLIENT_URL = new URL(process.env.CLIENT_URL).origin;
    } catch {
        throw new Error("CLIENT_URL must be a valid absolute URL");
    }

    if (process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long");
    }
};

module.exports = { validateEnv };

