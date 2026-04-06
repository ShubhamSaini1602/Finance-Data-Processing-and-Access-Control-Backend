import rateLimit from 'express-rate-limit';

// Limit auth routes to 10 requests per 15 minutes per IP
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 10 requests per `window`
    message: {
        success: false,
        message: "Too many login attempts from this IP, please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});