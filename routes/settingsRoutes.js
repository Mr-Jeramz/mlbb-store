const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");

// Get store settings
router.get("/", settingsController.getSettings);

// Update settings
router.put("/", settingsController.updateSettings);

module.exports = router;
