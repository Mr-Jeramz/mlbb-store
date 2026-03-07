const express = require("express");
const router = express.Router();

const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const settingsRoutes = require("./settingsRoutes");

router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
