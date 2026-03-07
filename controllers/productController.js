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
        
        // Handle field name mismatch: frontend sends 'title', backend uses 'name'
        // Frontend also sends: heroes, skins, winRate
        const { name, price, rank, image, description, heroes, skins, winRate } = req.body;
        const productName = name || req.body.title;
        
        // Handle undefined values - convert to null/default for MySQL
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
        
        const newProduct = {
            id: result.insertId,
            name: productName,
            price,
            rank: rankValue,
            image: imageValue,
            description: descriptionValue,
            heroes: heroesValue,
            skins: skinsValue,
            win_rate: winRateValue
        };
        
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Failed to add product' });
    }
};

// Update existing product
exports.updateProduct = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        
        // Handle field name mismatch: frontend sends 'title', backend uses 'name'
        // Frontend also sends: heroes, skins, winRate
        const { name, price, rank, image, description, heroes, skins, winRate } = req.body;
        const productName = name || req.body.title;
        
        // Handle undefined values - convert to null/default for MySQL
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

