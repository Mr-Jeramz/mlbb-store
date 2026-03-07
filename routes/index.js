// Main Routes - Combine all route modules

const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const settingsRoutes = require('./settingsRoutes');
const statsRoutes = require('./statsRoutes');

// Mount routes
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/settings', settingsRoutes);
router.use('/stats', statsRoutes);

module.exports = router;

