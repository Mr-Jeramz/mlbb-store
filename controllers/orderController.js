// Order Controller - Handle all order-related logic

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [rows] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
        
        const orders = rows.map(order => ({
            ...order,
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        }));
        
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = rows[0];
        order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        
        res.json(order);
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        
        const { customer_name, customer_contact, player_id, payment_method, notes, items, subtotal, processing_fee, total } = req.body;
        const itemsJson = JSON.stringify(items);
        
        const [result] = await pool.execute(
            'INSERT INTO orders (customer_name, customer_contact, player_id, payment_method, notes, items, subtotal, processing_fee, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customer_name, customer_contact, player_id, payment_method, notes, itemsJson, subtotal, processing_fee, total, 'pending']
        );
        
        const newOrder = {
            id: result.insertId,
            customer_name,
            customer_contact,
            player_id,
            payment_method,
            notes,
            items,
            subtotal,
            processing_fee,
            total,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
};

// Update order status
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

// Delete order
exports.deleteOrder = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ error: 'Failed to delete order' });
    }
};
