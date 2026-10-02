const errorMiddleware = (err, req, res, next) => {
    console.error(err);

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

    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;
