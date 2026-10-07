const baseCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
};

const authCookieOptions = {
    ...baseCookieOptions,
    maxAge: 24 * 60 * 60 * 1000
};

const getAuthCookieOptions = (maxAgeMs = authCookieOptions.maxAge) => ({
    ...baseCookieOptions,
    maxAge: maxAgeMs
});

const clearAuthCookieOptions = baseCookieOptions;

module.exports = {
    authCookieOptions,
    getAuthCookieOptions,
    clearAuthCookieOptions
};
