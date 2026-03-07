// Order Routes - Define all order-related routes

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// GET /api/orders - Get all orders
router.get('/', orderController.getAllOrders);

// GET /api/orders/:id - Get single order
router.get('/:id', orderController.getOrderById);

// POST /api/orders - Create new order
router.post('/', orderController.createOrder);

// PUT /api/orders/:id - Update order (status)
router.put('/:id', orderController.updateOrder);

// DELETE /api/orders/:id - Delete order
router.delete('/:id', orderController.deleteOrder);

module.exports = router;

