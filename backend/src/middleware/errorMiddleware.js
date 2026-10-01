const errorMiddleware = (
    err,
    req,
    res,
    next
) => {
    console.error(err);

    let statusCode =
        err.statusCode || 500;

    let message =
        err.isOperational
            ? err.message
            : "Internal server error";

    // MongoDB duplicate key
    if (err.code === 11000) {
        statusCode = 409;
        message = "Email already registered";
    }

    // Mongoose validation error
    if (
        err.name === "ValidationError"
    ) {
        statusCode = 400;

        const firstError =
            Object.values(err.errors)[0];

        message =
            firstError?.message ||
            "Validation failed";
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID";
    }

    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;