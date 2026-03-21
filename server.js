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

const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const createAccountsTable = `
        CREATE TABLE IF NOT EXISTS accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            game_email VARCHAR(255) NOT NULL,
            game_password VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `;

    await pool.execute(createProductsTable);
    await pool.execute(createOrdersTable);
    await pool.execute(createSettingsTable);
    await pool.execute(createAccountsTable);

    console.log("✅ Tables ready");

    await seedSampleData();
}

/* ---------------- SEED DATA ---------------- */

async function seedSampleData() {
    console.log("🌱 No seeding - add products from owner dashboard!");
}

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

/* ---------------- EMAIL SYSTEM (RESEND) ---------------- */

async function sendAccountEmail(toEmail, accountEmail, accountPassword) {
    try {
        const { data, error } = await resend.emails.send({
            from: "MLBB Store <onboarding@resend.dev>",
            to: [toEmail],
            subject: "Your MLBB Account Delivery",
            html: `
            <h2>Your MLBB Account</h2>
            <p><b>Email:</b> ${accountEmail}</p>
            <p><b>Password:</b> ${accountPassword}</p>
            <p>Please change the password immediately.</p>
            `
        });

        if (error) {
            console.error("EMAIL ERROR:", error);
        } else {
            console.log("EMAIL SENT:", data);
        }
    } catch (err) {
        console.error("EMAIL FAILURE:", err);
    }
}

module.exports.sendAccountEmail = sendAccountEmail;

/* ---------------- TEST EMAIL ---------------- */

app.get("/test-email", async (req, res) => {
    await sendAccountEmail(
        "your-email@gmail.com",
        "testaccount@gmail.com",
        "password123"
    );
    res.send("Test email sent");
});

/* ---------------- API ROUTES ---------------- */

const routes = require("./routes");
app.use("/api", routes);

/* ---------------- FRONTEND ROUTES ---------------- */

app.get("/store", (req, res) => {
    res.sendFile(path.join(__dirname, "mlbb.html"));
});

app.get("/owner", (req, res) => {
    res.sendFile(path.join(__dirname, "owner.html"));
});

app.get("/", (req, res) => {
    res.redirect("/store");
});

/* ---------------- START SERVER ---------------- */

async function startServer() {
    try {
        await initDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`Store → /store`);
            console.log(`Owner → /owner`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
}

startServer();
