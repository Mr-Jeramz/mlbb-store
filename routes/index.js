// Main Routes - Combine all route modules

const express = require("express");
const router = express.Router();

router.use("/products", require("./productRoutes"));
router.use("/orders", require("./orderRoutes"));
router.use("/stats", require("./statsRoutes"));
router.use("/settings", require("./settingsRoutes"));

module.exports = router;
