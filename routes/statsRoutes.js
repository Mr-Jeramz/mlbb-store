// Stats Routes - Define all stats-related routes

const express = require("express");
const router = express.Router();

const statsController = require("../controllers/statsController");

// Get dashboard statistics
router.get("/", statsController.getStats);

module.exports = router;
