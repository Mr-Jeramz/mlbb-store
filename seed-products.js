const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '54321',
    database: 'mlbb_store'
};

async function seedProducts() {
    const pool = mysql.createPool(dbConfig);
    
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
        console.log('Added:', product.name);
    }
    
    console.log('All sample products added!');
    process.exit(0);
}

seedProducts();

