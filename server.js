process.on("uncaughtException", err => {
    console.error("UNCAUGHT ERROR:", err);
});

process.on("unhandledRejection", err => {
    console.error("UNHANDLED PROMISE:", err);
});

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- MYSQL CONFIG ---------------- */

const dbConfig = {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    ssl: {
        rejectUnauthorized: false
    }
};

let pool;

/* ---------------- INIT DATABASE ---------------- */

async function initDB() {

    try {

        pool = mysql.createPool(dbConfig);

        const conn = await pool.getConnection();
        console.log("✅ Connected to MySQL database");
        conn.release();

        app.locals.pool = pool;

        await createTables();

    } catch (err) {

        console.error("❌ MySQL connection error:", err);

    }

}

/* ---------------- CREATE TABLES ---------------- */

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
            setting_key VARCHAR(255) UNIQUE,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

    await pool.execute(createProductsTable);
    await pool.execute(createOrdersTable);
    await pool.execute(createSettingsTable);

    console.log("✅ Tables ready");

    await seedSampleData();
}

/* ---------------- SEED DATA ---------------- */

async function seedSampleData() {

    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM products");

    if (rows[0].count === 0) {

        console.log("🌱 Seeding sample products");

        const products = [
            { name:"Exclusive Diamond Account",price:150,rank:"exclusive",heroes:80,skins:45,win_rate:72 },
            { name:"Exclusive Elite Account",price:120,rank:"exclusive",heroes:65,skins:35,win_rate:68 },
            { name:"Premium Glory Account",price:85,rank:"premium",heroes:55,skins:28,win_rate:62 },
            { name:"Premium Top Player",price:65,rank:"premium",heroes:50,skins:22,win_rate:58 },
            { name:"Collector Edition Account",price:45,rank:"collector",heroes:40,skins:18,win_rate:55 },
            { name:"Collector Account",price:35,rank:"collector",heroes:35,skins:15,win_rate:52 },
            { name:"Basic Starter Account",price:15,rank:"basic",heroes:25,skins:8,win_rate:48 },
            { name:"Basic Account",price:10,rank:"basic",heroes:20,skins:5,win_rate:45 }
        ];

        for (const p of products) {

            await pool.execute(
                "INSERT INTO products (name,price,`rank`,heroes,skins,win_rate) VALUES (?,?,?,?,?,?)",
                [p.name,p.price,p.rank,p.heroes,p.skins,p.win_rate]
            );

        }

        console.log("✅ Sample products added");

    }

}

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

/* ---------------- EMAIL SYSTEM ---------------- */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mlbbstore@gmail.com",
        pass: process.env.EMAIL_PASS
    }
});

async function sendAccountEmail(toEmail, accountEmail, accountPassword){

    await transporter.sendMail({
        from:'"MLBB Store" <mlbbstore@gmail.com>',
        to:toEmail,
        subject:"Your MLBB Account Delivery",
        html:`
        <h2>Your MLBB Account</h2>
        <p><b>Email:</b> ${accountEmail}</p>
        <p><b>Password:</b> ${accountPassword}</p>
        <p>Please change the password immediately.</p>
        `
    });

}

/* ---------------- TEST EMAIL ---------------- */

app.get("/test-email", async(req,res)=>{

    try{

        await sendAccountEmail(
            "YOUR_EMAIL@gmail.com",
            "testmoonton@gmail.com",
            "password123"
        );

        res.send("✅ Email sent");

    }catch(err){

        console.error(err);
        res.send("❌ Email failed");

    }

});

/* ---------------- API ROUTES ---------------- */

const routes = require("./routes");
app.use("/api", routes);

/* ---------------- FRONTEND ROUTES ---------------- */

app.get("/store",(req,res)=>{
    res.sendFile(path.join(__dirname,"mlbb.html"));
});

app.get("/owner",(req,res)=>{
    res.sendFile(path.join(__dirname,"owner.html"));
});

app.get("/",(req,res)=>{
    res.redirect("/store");
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, async () => {

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Store → /store`);
    console.log(`Owner → /owner`);

    await initDB();

});
