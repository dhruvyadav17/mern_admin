const SENSITIVE_KEYS = new Set([
    "password",
    "currentpassword",
    "confirmpassword",
    "token",
    "resettoken",
    "authorization"
]);

const redactSensitive = (value) => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(redactSensitive);

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            SENSITIVE_KEYS.has(key.toLowerCase()) ? "[redacted]" : redactSensitive(item)
        ])
    );
};

const errorMiddleware = (err, req, res, next) => {
    const logPayload = {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        body: redactSensitive(req.body),
        userId: req.user?._id?.toString?.(),
        error: {
            name: err?.name,
            message: err?.message,
            code: err?.code,
            statusCode: err?.statusCode,
            isOperational: err?.isOperational
        }
    };

    if (process.env.NODE_ENV === "production") {
        console.error("Request failed", logPayload);
    } else {
        console.error("Request failed", { ...logPayload, stack: err?.stack });
    }

    let statusCode = err.statusCode || 500;
    let message = err.isOperational
        ? err.message
        : "Internal server error";

    if (err.code === 11000) {
        statusCode = 409;
        message = "Email already registered";
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        const firstError = Object.values(err.errors)[0];
        message = firstError?.message || "Validation failed";
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID";
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        statusCode = 400;
        message = "Invalid JSON payload";
    }

    const response = {
        success: false,
        message,
    };

    // Development diagnostics only. Do not expose stack traces in production.
    if (process.env.NODE_ENV !== "production") {
        response.debug = err?.message;
        response.error = err?.name;
        response.code = err?.code;
        response.stack = err?.stack;
    }

    return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
