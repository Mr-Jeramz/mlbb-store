const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

// Get all products
router.get("/", productController.getAllProducts);

// Create new product
router.post("/", productController.createProduct);

module.exports = router;
