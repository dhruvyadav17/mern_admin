const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const {
    createCsrfToken,
    isValidCsrfToken
} = require("../src/utils/csrfToken");
const {
    normalizeSessionTimeoutMinutes,
    minutesToMilliseconds,
    minutesToSeconds,
    MIN_SESSION_TIMEOUT_MINUTES,
    MAX_SESSION_TIMEOUT_MINUTES
} = require("../src/utils/sessionPolicy");

test("csrf token validates when unchanged", () => {
    const token = createCsrfToken();
    assert.equal(isValidCsrfToken(token), true);
});

test("csrf token rejects tampering", () => {
    const token = createCsrfToken();
    assert.equal(isValidCsrfToken(`${token}a`), false);
});

test("session timeout is clamped to supported range", () => {
    assert.equal(
        normalizeSessionTimeoutMinutes(1),
        MIN_SESSION_TIMEOUT_MINUTES
    );
    assert.equal(
        normalizeSessionTimeoutMinutes(MAX_SESSION_TIMEOUT_MINUTES + 1),
        MAX_SESSION_TIMEOUT_MINUTES
    );
});

test("session timeout unit helpers are consistent", () => {
    assert.equal(minutesToSeconds(15), 900);
    assert.equal(minutesToMilliseconds(15), 900000);
});

