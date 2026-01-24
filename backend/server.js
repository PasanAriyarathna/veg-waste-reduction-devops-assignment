// ===== VEGETABLE WASTAGE REDUCTION SYSTEM =====
// Backend Server using Node.js + Express + SQLite

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '../frontend');
const DB_PATH = path.join(__dirname, '../veg_waste.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(PUBLIC_DIR));

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
            // ===== VEGETABLE WASTAGE REDUCTION SYSTEM =====
            // Backend Server using Node.js + Express

            const express = require('express');
            const bodyParser = require('body-parser');
            const cors = require('cors');
            const path = require('path');

            const app = express();
            const PORT = 3000;
            const PUBLIC_DIR = path.join(__dirname, '../frontend');

            // Middleware
            app.use(cors());
            app.use(bodyParser.json());
            app.use(express.static(PUBLIC_DIR));

            // ===== SERVER START =====
            app.listen(PORT, () => {
                console.log(`
                =====================================
                🥬 VEG WASTAGE REDUCTION SYSTEM
                =====================================
                ✅ Server running on http://localhost:${PORT}
                =====================================
                `);
            });
    });
