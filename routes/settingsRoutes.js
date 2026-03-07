const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");

router.get("/", settingsController.getAllSettings);
router.post("/", settingsController.updateSettings);

module.exports = router;
