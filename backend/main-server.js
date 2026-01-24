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
