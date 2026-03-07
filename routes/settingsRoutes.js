const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");

// Get settings
router.get("/", settingsController.getSettings);

// Save/update settings
router.put("/", settingsController.saveSettings);

module.exports = router;
