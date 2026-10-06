const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const {
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    isValidCsrfToken
} = require("../utils/csrfToken");

const csrfProtection = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    const origin = req.get("origin");

    if (origin && origin !== process.env.CLIENT_URL) {
        return res.status(403).json({
            success: false,
            message: "Invalid request origin"
        });
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (
        !cookieToken ||
        !headerToken ||
        cookieToken !== headerToken ||
        !isValidCsrfToken(headerToken)
    ) {
        return res.status(403).json({
            success: false,
            message: "Invalid CSRF token"
        });
    }

    return next();
};

module.exports = csrfProtection;

