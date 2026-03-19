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
        const { customer_name, customer_contact, player_id, payment_method, notes, items, subtotal, processing_fee, total, payment_id } = req.body;
        const itemsJson = JSON.stringify(items);
        const status = payment_id ? 'completed' : 'pending';
        
        const [result] = await pool.execute(
            'INSERT INTO orders (customer_name, customer_contact, player_id, payment_method, notes, items, subtotal, processing_fee, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customer_name, customer_contact, player_id, payment_method, notes, itemsJson, subtotal, processing_fee, total, status]
        );

        const orderId = result.insertId;

        if (payment_id) {
            const { sendAccountEmail } = require("../server");
            const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

            for (const item of parsedItems) {
                const productId = item.id;
                const [accounts] = await pool.execute(
                    "SELECT * FROM accounts WHERE product_id = ? AND status = 'available' LIMIT 1",
                    [productId]
                );

                if (accounts.length > 0) {
                    const account = accounts[0];
                    await pool.execute(
                        "UPDATE accounts SET status = 'sold' WHERE id = ?",
                        [account.id]
                    );
                    await sendAccountEmail(
                        customer_contact,
                        account.game_email,
                        account.game_password
                    );
                    await pool.execute(
                        "DELETE FROM products WHERE id = ?",
                        [productId]
                    );
                }
            }
        }

        res.status(201).json({ 
            message: 'Order placed successfully', 
            order: { id: orderId, status }
        });

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

        await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

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

        if (status === "completed") {
            const { sendAccountEmail } = require("../server");
            const customerEmail = order.customer_contact;

            for (const item of order.items) {
                const productId = item.id;
                const [accounts] = await pool.execute(
                    "SELECT * FROM accounts WHERE product_id = ? AND status = 'available' LIMIT 1",
                    [productId]
                );

                if (accounts.length > 0) {
                    const account = accounts[0];
                    await pool.execute(
                        "UPDATE accounts SET status = 'sold' WHERE id = ?",
                        [account.id]
                    );
                    await sendAccountEmail(
                        customerEmail,
                        account.game_email,
                        account.game_password
                    );
                    await pool.execute(
                        "DELETE FROM products WHERE id = ?",
                        [productId]
                    );
                }
            }
        }

        res.json({ message: "Order updated successfully", order });

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
