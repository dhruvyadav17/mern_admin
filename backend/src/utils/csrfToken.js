const crypto = require("crypto");

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_BYTES = 32;

const getSecret = () => process.env.CSRF_SECRET || process.env.JWT_SECRET;

const sign = (nonce) =>
    crypto.createHmac("sha256", getSecret()).update(nonce).digest("hex");

const createCsrfToken = () => {
    const nonce = crypto.randomBytes(TOKEN_BYTES).toString("hex");
    return `${nonce}.${sign(nonce)}`;
};

const isValidCsrfToken = (token) => {
    if (!token || typeof token !== "string") return false;

    const [nonce, signature, extra] = token.split(".");
    if (!nonce || !signature || extra) return false;
    if (
        !/^[a-f0-9]+$/i.test(nonce) ||
        nonce.length !== TOKEN_BYTES * 2 ||
        !/^[a-f0-9]+$/i.test(signature) ||
        signature.length !== 64
    ) {
        return false;
    }

    const expected = sign(nonce);
    const actualBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    return (
        actualBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    );
};

const csrfCookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};

module.exports = {
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    createCsrfToken,
    isValidCsrfToken,
    csrfCookieOptions
};

