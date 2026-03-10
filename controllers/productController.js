// Product Controller - Handle all product-related logic

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [rows] = await pool.execute('SELECT * FROM products');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const { name, price, rank, image, description, heroes, skins, winRate } = req.body;
        const productName = name || req.body.title;

        const rankValue = rank === undefined ? null : rank;
        const imageValue = image === undefined ? null : image;
        const descriptionValue = description === undefined ? null : description;
        const heroesValue = heroes === undefined ? 0 : heroes;
        const skinsValue = skins === undefined ? 0 : skins;
        const winRateValue = winRate === undefined ? 0 : winRate;

        const [result] = await pool.execute(
            'INSERT INTO products (name, price, `rank`, image, description, heroes, skins, win_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [productName, price, rankValue, imageValue, descriptionValue, heroesValue, skinsValue, winRateValue]
        );

        // ✅ Returns id at top level so frontend can access createdProduct.id directly
        res.status(201).json({
            id: result.insertId,
            name: productName,
            price,
            rank: rankValue,
            image: imageValue,
            description: descriptionValue,
            heroes: heroesValue,
            skins: skinsValue,
            win_rate: winRateValue
        });

    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Failed to add product' });
    }
};

// Update existing product
exports.updateProduct = async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const { name, price, rank, image, description, heroes, skins, winRate } = req.body;
        const productName = name || req.body.title;

        const rankValue = rank === undefined ? null : rank;
        const imageValue = image === undefined ? null : image;
        const descriptionValue = description === undefined ? null : description;
        const heroesValue = heroes === undefined ? 0 : heroes;
        const skinsValue = skins === undefined ? 0 : skins;
        const winRateValue = winRate === undefined ? 0 : winRate;

        const [result] = await pool.execute(
            'UPDATE products SET name = ?, price = ?, `rank` = ?, image = ?, description = ?, heroes = ?, skins = ?, win_rate = ? WHERE id = ?',
            [productName, price, rankValue, imageValue, descriptionValue, heroesValue, skinsValue, winRateValue, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product updated successfully', product: rows[0] });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
