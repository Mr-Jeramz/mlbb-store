exports.updateOrder = async (req, res) => {
    try {

        const pool = req.app.locals.pool;
        const { status } = req.body;

        // Update order status
        await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        // Get updated order
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = rows[0];
        order.items = typeof order.items === 'string'
            ? JSON.parse(order.items)
            : order.items;

        /* -------- ACCOUNT DELIVERY + PRODUCT REMOVAL -------- */

        if (status === "completed") {

            const { sendAccountEmail } = require("../server");

            const customerEmail = order.customer_contact;

            // Loop through all items in the order
            for (const item of order.items) {
                const productId = item.id;

                // Find available account for this product
                const [accounts] = await pool.execute(
                    "SELECT * FROM accounts WHERE product_id = ? AND status = 'available' LIMIT 1",
                    [productId]
                );

                if (accounts.length > 0) {
                    const account = accounts[0];

                    // Mark account as sold
                    await pool.execute(
                        "UPDATE accounts SET status = 'sold' WHERE id = ?",
                        [account.id]
                    );

                    // Send account credentials to customer
                    await sendAccountEmail(
                        customerEmail,
                        account.game_email,
                        account.game_password
                    );
                }

                // ✅ Delete the product from the store
                await pool.execute(
                    "DELETE FROM products WHERE id = ?",
                    [productId]
                );
            }
        }

        /* ---------------------------------------------------- */

        res.json({
            message: "Order updated successfully",
            order
        });

    } catch (err) {

        console.error("Error updating order:", err);
        res.status(500).json({ error: "Failed to update order" });

    }
};
