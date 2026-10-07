const DEFAULT_SESSION_TIMEOUT_MINUTES = 1440;
const MIN_SESSION_TIMEOUT_MINUTES = 5;
const MAX_SESSION_TIMEOUT_MINUTES = 60 * 24 * 30;

const normalizeSessionTimeoutMinutes = (value) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return DEFAULT_SESSION_TIMEOUT_MINUTES;
    }

    return Math.min(
        MAX_SESSION_TIMEOUT_MINUTES,
        Math.max(MIN_SESSION_TIMEOUT_MINUTES, Math.floor(numeric))
    );
};

const minutesToSeconds = (minutes) => minutes * 60;
const minutesToMilliseconds = (minutes) => minutesToSeconds(minutes) * 1000;

module.exports = {
    DEFAULT_SESSION_TIMEOUT_MINUTES,
    MIN_SESSION_TIMEOUT_MINUTES,
    MAX_SESSION_TIMEOUT_MINUTES,
    normalizeSessionTimeoutMinutes,
    minutesToSeconds,
    minutesToMilliseconds
};
