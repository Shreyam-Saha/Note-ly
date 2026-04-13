const rateLimit = require("express-rate-limit");

// Strict limit for authentication (e.g., 5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: { error: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limit for sharing notes (e.g., 20 requests per hour)
const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: "Too many share requests created, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, shareLimiter };