const errorMiddleware = (err, req, res, next) => {
    console.error("\n==============================================");
    console.error("GLOBAL ERROR MIDDLEWARE");
    console.error("==============================================");
    console.error("METHOD:", req.method);
    console.error("URL:", req.originalUrl);
    console.error("PARAMS:", req.params);
    console.error("BODY:", req.body);
    console.error("USER ID:", req.user?._id);
    console.error("USER EMAIL:", req.user?.email);
    console.error("PERMISSIONS:", req.permissions);
    console.error("----------------------------------------------");
    console.error("ERROR NAME:", err?.name);
    console.error("ERROR MESSAGE:", err?.message);
    console.error("ERROR CODE:", err?.code);
    console.error("ERROR STATUS:", err?.status);
    console.error("ERROR STATUS CODE:", err?.statusCode);
    console.error("ERROR OPERATIONAL:", err?.isOperational);
    console.error("----------------------------------------------");
    console.error("ERROR STACK:");
    console.error(err?.stack);
    console.error("==============================================\n");

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
