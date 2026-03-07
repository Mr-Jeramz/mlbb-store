// Settings Controller - Handle all settings-related logic

// Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [rows] = await pool.execute('SELECT * FROM settings');
        
        // Convert to key-value object
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const settings = req.body;
        
        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            await pool.execute(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        }
        
        res.json({ message: 'Settings saved successfully' });
    } catch (err) {
        console.error('Error saving settings:', err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
};

