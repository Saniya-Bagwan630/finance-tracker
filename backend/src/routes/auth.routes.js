const express = require("express");
const { registerUser, loginUser, updateUser } = require("../controllers/auth.controller");

const router = express.Router();

/**
 * POST /auth/signup
 */
router.post("/signup", registerUser);

/**
 * POST /auth/login
 */
router.post("/login", loginUser);

/**
 * PUT /auth/update
 */
router.put("/update", require("../middleware/auth.middleware"), updateUser);

module.exports = router;
