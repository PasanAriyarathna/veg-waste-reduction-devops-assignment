// ===== VEGETABLE WASTAGE REDUCTION SYSTEM =====
// Backend Server using Node.js + Express + SQLite

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

module.exports = { app, PORT };
