"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicLeadLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
function createRateLimiter(options) {
    const { windowMs, max, message = "Too many requests. Please try again later." } = options;
    const ipRequests = new Map();
    // Periodically clean up stale IPs every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [ip, timestamps] of ipRequests.entries()) {
            const valid = timestamps.filter((t) => now - t < windowMs);
            if (valid.length === 0) {
                ipRequests.delete(ip);
            }
            else {
                ipRequests.set(ip, valid);
            }
        }
    }, 5 * 60 * 1000).unref();
    return (req, res, next) => {
        // Get client IP, supporting proxies
        const forwarded = req.headers["x-forwarded-for"];
        const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) ||
            "unknown-ip";
        const now = Date.now();
        const timestamps = (ipRequests.get(ip) || []).filter((t) => now - t < windowMs);
        if (timestamps.length >= max) {
            const oldest = timestamps[0];
            const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
            res.setHeader("Retry-After", retryAfterSeconds);
            return res.status(429).json({
                success: false,
                message,
                retryAfterSeconds,
            });
        }
        timestamps.push(now);
        ipRequests.set(ip, timestamps);
        next();
    };
}
exports.publicLeadLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 10, // Max 10 submissions per IP per 15 minutes
    message: "Too many lead submissions from this network. Please try again in a few minutes.",
});
