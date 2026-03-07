// Settings Routes - Define all settings-related routes

const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");

router.get("/", settingsController.getSettings);
router.put("/", settingsController.saveSettings);

module.exports = router;
