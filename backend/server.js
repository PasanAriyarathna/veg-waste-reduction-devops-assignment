// ===== VEGETABLE WASTAGE REDUCTION SYSTEM =====
// Backend Server using Node.js + Express

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '../frontend');
const DB_PATH = path.join(__dirname, '../veg_waste.db');

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
