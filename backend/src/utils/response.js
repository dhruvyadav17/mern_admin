const successResponse = (
    res,
    data = null,
    message = "Success",
    statusCode = 200,
    extra = {}
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...extra
    });
};

module.exports = {
    successResponse
};

