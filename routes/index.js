const express = require("express");
const router = express.Router();

const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const settingsRoutes = require("./settingsRoutes");
const accountRoutes = require("./accountRoutes");

router.use("/accounts", accountRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
