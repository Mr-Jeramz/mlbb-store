const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL Connection Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '54321',
    database: 'mlbb_store'
};

let pool;

// Create connection pool
async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        
        // Make pool available to controllers via app.locals
        app.locals.pool = pool;
        
        console.log('Connected to MySQL database');
        
        // Create tables if they don't exist
        await createTables();
    } catch (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
}

// Create required tables
async function createTables() {
    const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            \`rank\` VARCHAR(50),
            image TEXT,
            description TEXT,
            heroes INT DEFAULT 0,
            skins INT DEFAULT 0,
            win_rate INT DEFAULT 0
        )
    `;
    
    const createOrdersTable = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(255) NOT NULL,
            customer_contact VARCHAR(255),
            player_id VARCHAR(100),
            payment_method VARCHAR(50),
            notes TEXT,
            items JSON NOT NULL,
            subtotal DECIMAL(10,2) DEFAULT 0,
            processing_fee DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(255) NOT NULL UNIQUE,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    await pool.execute(createProductsTable);
    await pool.execute(createOrdersTable);
    await pool.execute(createSettingsTable);
    
    // Migration: Add new columns if they don't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE products ADD COLUMN heroes INT DEFAULT 0');
    } catch (e) {
        // Column already exists, ignore
    }
    try {
        await pool.execute('ALTER TABLE products ADD COLUMN skins INT DEFAULT 0');
    } catch (e) {
        // Column already exists, ignore
    }
    try {
        await pool.execute('ALTER TABLE products ADD COLUMN win_rate INT DEFAULT 0');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add player_id to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN player_id VARCHAR(100) AFTER customer_contact');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add payment_method to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) AFTER player_id');
    } catch (e) {
        // Column already exists, ignore
    }
    
// Migration: Add notes to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN notes TEXT AFTER payment_method');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add items to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN items JSON NOT NULL AFTER notes');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add subtotal to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0 AFTER items');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add processing_fee to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN processing_fee DECIMAL(10,2) DEFAULT 0 AFTER subtotal');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add total to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) NOT NULL AFTER processing_fee');
    } catch (e) {
        // Column already exists, ignore
    }
    
    // Migration: Add status to orders table if it doesn't exist (for existing databases)
    try {
        await pool.execute('ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT "pending" AFTER total');
    } catch (e) {
        // Column already exists, ignore
    }
    
    console.log('Tables created successfully');
    
    // Seed sample data if database is empty
    await seedSampleData();
}

// Seed sample products
async function seedSampleData() {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const count = rows[0].count;
    
    if (count === 0) {
        console.log('Seeding sample products...');
        const sampleProducts = [
            { name: 'Exclusive Diamond Account', price: 150, rank: 'exclusive', heroes: 80, skins: 45, win_rate: 72 },
            { name: 'Exclusive Elite Account', price: 120, rank: 'exclusive', heroes: 65, skins: 35, win_rate: 68 },
            { name: 'Premium Glory Account', price: 85, rank: 'premium', heroes: 55, skins: 28, win_rate: 62 },
            { name: 'Premium Top Player', price: 65, rank: 'premium', heroes: 50, skins: 22, win_rate: 58 },
            { name: 'Collector Edition Account', price: 45, rank: 'collector', heroes: 40, skins: 18, win_rate: 55 },
            { name: 'Collector Account', price: 35, rank: 'collector', heroes: 35, skins: 15, win_rate: 52 },
            { name: 'Basic Starter Account', price: 15, rank: 'basic', heroes: 25, skins: 8, win_rate: 48 },
            { name: 'Basic Account', price: 10, rank: 'basic', heroes: 20, skins: 5, win_rate: 45 },
            { name: 'Exclusive Mythic Account', price: 200, rank: 'exclusive', heroes: 90, skins: 60, win_rate: 75 },
            { name: 'Premium Legend Account', price: 55, rank: 'premium', heroes: 45, skins: 20, win_rate: 56 },
            { name: 'Collector Pro Account', price: 40, rank: 'collector', heroes: 38, skins: 16, win_rate: 54 },
            { name: 'Basic Elite Account', price: 20, rank: 'basic', heroes: 30, skins: 10, win_rate: 50 }
        ];
        
        for (const product of sampleProducts) {
            await pool.execute(
                'INSERT INTO products (name, price, `rank`, heroes, skins, win_rate) VALUES (?, ?, ?, ?, ?, ?)',
                [product.name, product.price, product.rank, product.heroes, product.skins, product.win_rate]
            );
        }
        console.log('Sample products seeded successfully!');
    }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

// Import routes
const apiRoutes = require('./routes');

// Mount API routes at /api
app.use('/api', apiRoutes);

// Serve the main HTML files - Clean URLs (no .html extension)
app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'mlbb.html'));
});

// Redirect root to store
app.get('/', (req, res) => {
    res.redirect('/store');
});

app.get('/owner', (req, res) => {
    res.sendFile(path.join(__dirname, 'owner.html'));
});

// Initialize database and start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`MLBB Store Server running on http://localhost:${PORT}`);
        console.log(`Customer Store: http://localhost:${PORT}/store`);
        console.log(`Owner Dashboard: http://localhost:${PORT}/owner`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

