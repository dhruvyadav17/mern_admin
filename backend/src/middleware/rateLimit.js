const createRateLimiter = ({ windowMs, max, message }) => {
    const hits = new Map();

    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits.entries()) {
            if (entry.resetAt <= now) {
                hits.delete(key);
            }
        }
    }, Math.min(windowMs, 60_000));

    cleanup.unref?.();

    return (req, res, next) => {
        const key = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();
        let entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        res.setHeader("RateLimit-Limit", max);
        res.setHeader("RateLimit-Remaining", Math.max(max - entry.count, 0));
        res.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

        if (entry.count > max) {
            return res.status(429).json({
                success: false,
                message
            });
        }

        return next();
    };
};

const loginRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Please try again later."
});

const registerRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many registration attempts. Please try again later."
});

module.exports = {
    loginRateLimit,
    registerRateLimit
};
