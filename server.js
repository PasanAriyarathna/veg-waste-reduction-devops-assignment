// ===== VEGETABLE WASTAGE REDUCTION SYSTEM =====
// Backend Server using Node.js + Express + SQLite

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// ===== DATABASE SETUP =====
const db = new sqlite3.Database('./veg_waste.db', (err) => {
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

    // Harvest data table
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

    // Insert sample vegetables
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

    console.log('✅ Users table initialized');
});

// Seed default admin if none exists
db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`, (err, row) => {
    if (!row) {
        db.run(`INSERT OR IGNORE INTO users (email, password, name, phone, role, district) VALUES (?, ?, ?, ?, 'admin', NULL)`,
            ['admin@vegwaste.lk', 'admin123', 'Admin User', '0771234567'],
            (e) => {
                if (!e) console.log('✅ Seeded default admin: admin@vegwaste.lk / admin123');
            }
        );
    }
});

// Seed sample agents if none exist
db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'agent'`, (err, row) => {
    if (!err && row.count === 0) {
        const sampleAgents = [
            ['agent.colombo@vegwaste.lk', 'agent123', 'Nimal Perera', '0771111111', 'Colombo'],
            ['agent.kandy@vegwaste.lk', 'agent123', 'Saman Silva', '0772222222', 'Kandy'],
            ['agent.galle@vegwaste.lk', 'agent123', 'Kumari Fernando', '0773333333', 'Galle']
        ];
        
        sampleAgents.forEach(agent => {
            db.run(`INSERT OR IGNORE INTO users (email, password, name, phone, role, district) VALUES (?, ?, ?, ?, 'agent', ?)`,
                agent,
                (e) => {
                    if (!e) console.log(`✅ Seeded sample agent: ${agent[0]} / agent123`);
                }
            );
        });
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

// ===== INPUT VALIDATION HELPERS =====
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

module.exports = { app, PORT, db, isValidEmail, isValidPassword };
