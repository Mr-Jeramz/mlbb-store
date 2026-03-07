// Stats Controller - Handle all stats-related logic

// Get dashboard statistics
exports.getStats = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        
        const [products] = await pool.execute('SELECT * FROM products');
        const [orders] = await pool.execute('SELECT * FROM orders');
        
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, p) => sum + parseFloat(p.price), 0);
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        
        // Find most common tier
        const rankCounts = products.reduce((acc, p) => {
            acc[p.rank] = (acc[p.rank] || 0) + 1;
            return acc;
        }, {});
        
        const topRank = Object.entries(rankCounts).sort((a, b) => b[1] - a[1])[0];
        
        res.json({
            totalProducts,
            totalValue,
            totalOrders,
            totalRevenue,
            topTier: topRank ? topRank[0] : null
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

