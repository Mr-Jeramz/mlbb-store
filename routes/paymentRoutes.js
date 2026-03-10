const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
router.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body;
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        });
        res.json({ success: true, order });
    } catch (error) {
        console.error('Razorpay order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify payment
router.post('/verify', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .toString('hex');

        if (razorpay_signature === expectedSign) {
            res.json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
