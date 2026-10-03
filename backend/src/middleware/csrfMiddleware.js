const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const csrfProtection = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    const origin = req.get("origin");

    // Same-origin non-browser clients may omit Origin. Cookie-authenticated
    // browser requests normally include it, so validate it whenever present.
    if (!origin) {
        return next();
    }

    if (origin !== process.env.CLIENT_URL) {
        return res.status(403).json({
            success: false,
            message: "Invalid request origin"
        });
    }

    return next();
};

module.exports = csrfProtection;
