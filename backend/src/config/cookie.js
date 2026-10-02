const baseCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
};

const authCookieOptions = {
    ...baseCookieOptions,
    maxAge: 24 * 60 * 60 * 1000
};

const clearAuthCookieOptions = baseCookieOptions;

module.exports = {
    authCookieOptions,
    clearAuthCookieOptions
};
