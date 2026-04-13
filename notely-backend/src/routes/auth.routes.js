const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/login", authLimiter, authController.login);
router.post("/signup", authLimiter, authController.signup);

module.exports = router;
