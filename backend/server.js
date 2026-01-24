// ===== VEGETABLE WASTAGE REDUCTION SYSTEM =====
// Backend Server using Node.js + Express

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '../frontend');
const BASE_DB_PATH = path.join(__dirname, '../veg_waste.db');
const TMP_DB_PATH = path.join('/tmp', 'veg_waste.db');
const IS_VERCEL = !!process.env.VERCEL;

// On Vercel, copy SQLite DB to /tmp (writeable) to avoid read-only errors
const DB_PATH = (() => {
    if (IS_VERCEL) {
        try {
            if (!fs.existsSync(TMP_DB_PATH)) {
                fs.copyFileSync(BASE_DB_PATH, TMP_DB_PATH);
            }
            return TMP_DB_PATH;
        } catch (err) {
            console.error('⚠️ Failed to prepare /tmp SQLite DB; falling back to base path', err);
            return BASE_DB_PATH;
        }
    }
    return BASE_DB_PATH;
})();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(PUBLIC_DIR));

// ===== DATABASE SETUP =====
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error(err.message);
    else console.log('✅ Connected to SQLite Database');
});

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            role TEXT NOT NULL,
            district TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Vegetables table
    db.run(`
        CREATE TABLE IF NOT EXISTS vegetables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            emoji TEXT,
            description TEXT
        )
    `);

    // Harvest data table (stores data by employee/district)
    db.run(`
        CREATE TABLE IF NOT EXISTS harvest_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vegetable_id INTEGER NOT NULL,
            district TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT DEFAULT 'kg',
            harvest_date DATE NOT NULL,
            employee_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vegetable_id) REFERENCES vegetables(id),
            FOREIGN KEY (employee_id) REFERENCES users(id)
        )
    `);

    // Seed default vegetables
    const vegetables = [
        { name: 'Spinach', emoji: '🥬', description: 'Leafy green vegetable' },
        { name: 'Carrot', emoji: '🥕', description: 'Root vegetable' },
        { name: 'Tomato', emoji: '🍅', description: 'Fruit vegetable' },
        { name: 'Cabbage', emoji: '🥬', description: 'Cruciferous vegetable' },
        { name: 'Bell Pepper', emoji: '🫑', description: 'Sweet pepper' },
        { name: 'Onion', emoji: '🧅', description: 'Bulb vegetable' },
        { name: 'Cucumber', emoji: '🥒', description: 'Gourd vegetable' },
        { name: 'Broccoli', emoji: '🥦', description: 'Green cruciferous' }
    ];

    vegetables.forEach(veg => {
        db.run(
            `INSERT OR IGNORE INTO vegetables (name, emoji, description) VALUES (?, ?, ?)`,
            [veg.name, veg.emoji, veg.description]
        );
    });

    // Seed default users if missing (admin, two agents, one customer)
    const defaultUsers = [
        {
            email: 'admin@mail.com',
            password: 'admin123',
            name: 'System Admin',
            phone: '0700000000',
            role: 'admin',
            district: null
        },
        {
            email: 'farmer@colombo.com',
            password: 'farm123',
            name: 'Colombo Farmer',
            phone: '0701234567',
            role: 'employee',
            district: 'Colombo'
        },
        {
            email: 'farmer@galle.com',
            password: 'farm123',
            name: 'Galle Farmer',
            phone: '0712345678',
            role: 'employee',
            district: 'Galle'
        },
        {
            email: 'customer@mail.com',
            password: 'cust123',
            name: 'John Customer',
            phone: '0723456789',
            role: 'customer',
            district: null
        }
    ];

    defaultUsers.forEach(user => {
        db.run(
            `INSERT OR IGNORE INTO users (email, password, name, phone, role, district) VALUES (?, ?, ?, ?, ?, ?)`,
            [user.email, user.password, user.name, user.phone, user.role, user.district]
        );
    });

    console.log('✅ Database tables initialized');
});

// ===== SIMPLE INPUT VALIDATION HELPERS =====
function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(trimmed) && trimmed.length <= 254;
}

function isValidPassword(password) {
    if (typeof password !== 'string') return false;
    const trimmed = password.trim();
    return trimmed.length >= 6 && trimmed.length <= 128;
}

// ===== AUTHENTICATION APIS =====

// 1. REGISTER API
app.post('/api/auth/register', (req, res) => {
    const { email, password, name, phone, district } = req.body;

    // Validate required fields
    if (!email || !password || !name || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Auto-detect role based on district and phone patterns
    // If district is provided, they're likely an employee
    const role = district ? 'employee' : 'customer';

    db.run(
        `INSERT INTO users (email, password, name, phone, role, district) VALUES (?, ?, ?, ?, ?, ?)`,
        [email, password, name, phone, role, district || null],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            res.json({
                success: true,
                message: 'Registration successful',
                userId: this.lastID,
                role: role
            });
        }
    );
});

// 2. LOGIN API
app.post('/api/auth/login', (req, res) => {
    const email = (req.body.email || '').trim();
    const password = (req.body.password || '').trim();

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be 6+ characters' });
    }

    db.get(
        `SELECT * FROM users WHERE email = ? AND password = ?`,
        [email, password],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Return user with role (automatic role detection)
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    district: user.district
                }
            });
        }
    );
});

// ===== VEGETABLE CATEGORIES API =====

// 3. GET ALL VEGETABLES
app.get('/api/vegetables', (req, res) => {
    db.all(`SELECT * FROM vegetables`, (err, vegetables) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(vegetables);
    });
});

// 4. GET SINGLE VEGETABLE
app.get('/api/vegetables/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT * FROM vegetables WHERE id = ?`,
        [id],
        (err, vegetable) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!vegetable) {
                return res.status(404).json({ error: 'Vegetable not found' });
            }
            res.json(vegetable);
        }
    );
});

// ===== HARVEST DATA APIs =====

// 5. GET HARVEST DATA FOR A VEGETABLE (for chart)
app.get('/api/harvest/:vegetableId', (req, res) => {
    const { vegetableId } = req.params;

    db.all(
        `SELECT 
            district, 
            SUM(quantity) as total_quantity,
            harvest_date
         FROM harvest_data 
         WHERE vegetable_id = ? 
         GROUP BY district, harvest_date
         ORDER BY harvest_date DESC`,
        [vegetableId],
        (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(data);
        }
    );
});

// 6. ADD HARVEST DATA (EMPLOYEES ONLY)
app.post('/api/harvest', (req, res) => {
    const { vegetableId, district, quantity, harvestDate, employeeId, employeeRole } = req.body;

    // Check if user is an employee
    if (employeeRole !== 'employee') {
        return res.status(403).json({ error: 'Only employees can add harvest data' });
    }

    if (!vegetableId || !district || !quantity || !harvestDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
        `INSERT INTO harvest_data (vegetable_id, district, quantity, harvest_date, employee_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [vegetableId, district, quantity, harvestDate, employeeId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add harvest data' });
            }
            res.json({
                success: true,
                message: 'Harvest data added successfully',
                dataId: this.lastID
            });
        }
    );
});

// 7. UPDATE HARVEST DATA (EMPLOYEES ONLY)
app.put('/api/harvest/:id', (req, res) => {
    const { id } = req.params;
    const { quantity, district, harvestDate, employeeRole } = req.body;

    if (employeeRole !== 'employee') {
        return res.status(403).json({ error: 'Only employees can update harvest data' });
    }

    db.run(
        `UPDATE harvest_data 
         SET quantity = ?, district = ?, harvest_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [quantity, district, harvestDate, id],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update harvest data' });
            }
            res.json({ success: true, message: 'Harvest data updated successfully' });
        }
    );
});

// 8. DELETE HARVEST DATA (EMPLOYEES ONLY)
app.delete('/api/harvest/:id', (req, res) => {
    const { id } = req.params;
    const { employeeRole } = req.body;

    if (employeeRole !== 'employee') {
        return res.status(403).json({ error: 'Only employees can delete harvest data' });
    }

    db.run(`DELETE FROM harvest_data WHERE id = ?`, [id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete harvest data' });
        }
        res.json({ success: true, message: 'Harvest data deleted successfully' });
    });
});

// 9. GET ALL DISTRICTS (for dropdown)
app.get('/api/districts', (req, res) => {
    const districts = [
        'Colombo', 'Galle', 'Matara', 'Hambantota', 'Kalutara', 'Rathnapura', 'Kegalle',
        'Kandy', 'Matale', 'Nuwara Eliya', 'Badulla', 'Monaragala', 'Ampara', 'Batticaloa',
        'Trincomalee', 'Mullaitivu', 'Vavuniya', 'Anuradhapura', 'Polonnaruwa', 'Kurunegala', 'Puttalam', 'Jaffna'
    ];
    res.json(districts);
});

// ===== SERVER START =====
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
        =====================================
        🥬 VEG WASTAGE REDUCTION SYSTEM
        =====================================
        ✅ Server running on http://localhost:${PORT}
        ✅ Database: ${IS_VERCEL ? TMP_DB_PATH : BASE_DB_PATH}
        ✅ Ready to reduce wastage in Sri Lanka!
        =====================================
        `);
    });
}

// Export app for serverless environments (e.g., Vercel)
module.exports = app;
