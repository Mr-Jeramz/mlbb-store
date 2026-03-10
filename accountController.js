// Account Controller

// Get all accounts
exports.getAccounts = async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const [rows] = await pool.execute(
            "SELECT id, product_id, status FROM accounts ORDER BY id DESC"
        );

        res.json(rows);

    } catch (err) {
        console.error("Error fetching accounts:", err);
        res.status(500).json({ error: "Failed to fetch accounts" });
    }
};


// Add new account
exports.createAccount = async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const { product_id, game_email, game_password } = req.body;

        const [result] = await pool.execute(
            "INSERT INTO accounts (product_id, game_email, game_password, status) VALUES (?, ?, ?, 'available')",
            [product_id, game_email, game_password]
        );

        res.json({
            message: "Account added successfully",
            id: result.insertId
        });

    } catch (err) {
        console.error("Error adding account:", err);
        res.status(500).json({ error: "Failed to add account" });
    }
};
