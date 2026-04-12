const express = require("express");
const { getBudgets, updateBudgets } = require("../controllers/budget.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getBudgets);
router.put("/", authMiddleware, updateBudgets);

module.exports = router;
