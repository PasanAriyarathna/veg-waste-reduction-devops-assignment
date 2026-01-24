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

    console.log('✅ Database tables initialized');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

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

// ===== AUTHENTICATION & REGISTRATION API =====

// REGISTER API - Customers only
app.post('/api/auth/register', (req, res) => {
    const { email, password, name, phone, accountType } = req.body;

    if (!email || !password || !name || !phone || !accountType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (accountType !== 'customer') {
        return res.status(403).json({ error: 'Agent accounts can only be created by Admin' });
    }

    db.run(
        `INSERT INTO users (email, password, name, phone, role, district) VALUES (?, ?, ?, ?, 'customer', NULL)`,
        [email, password, name, phone],
        function(err) {
            if (err) {
                if (String(err.message).toLowerCase().includes('unique')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Registration failed' });
            }
            res.json({
                success: true,
                message: 'Customer account created successfully',
                userId: this.lastID
            });
        }
    );
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

// LOGIN API
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

// ===== ADMIN AGENT MANAGEMENT APIs =====

// Admin creates Agent
app.post('/api/admin/create-agent', (req, res) => {
    const { requesterId, email, password, name, phone, district } = req.body;

    if (!requesterId) return res.status(401).json({ error: 'Unauthorized: missing requester' });
    if (!email || !password || !name || !phone || !district) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.get(`SELECT role FROM users WHERE id = ?`, [requesterId], (err, requester) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only Admin can create agents' });
        }

        db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'agent'`, (err2, cRow) => {
            if (err2) return res.status(500).json({ error: 'Database error' });
            if ((cRow?.count || 0) >= 25) {
                return res.status(400).json({ error: 'Agent limit reached (25 districts)' });
            }

            db.get(`SELECT id FROM users WHERE role = 'agent' AND LOWER(district) = LOWER(?)`, [district], (err3, existing) => {
                if (err3) return res.status(500).json({ error: 'Database error' });
                if (existing) {
                    return res.status(400).json({ error: 'An agent already monitors this district' });
                }

                db.run(`INSERT INTO users (email, password, name, phone, role, district) VALUES (?, ?, ?, ?, 'agent', ?)`,
                    [email, password, name, phone, district],
                    function(err4) {
                        if (err4) {
                            if (String(err4.message).toLowerCase().includes('unique')) {
                                return res.status(400).json({ error: 'Email already exists' });
                            }
                            return res.status(500).json({ error: 'Failed to create agent' });
                        }
                        res.json({ success: true, agentId: this.lastID });
                    }
                );
            });
        });
    });
});

// List all agents (Admin only)
app.get('/api/admin/agents', (req, res) => {
    const requesterId = Number(req.query.requesterId);
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    db.get(`SELECT role FROM users WHERE id = ?`, [requesterId], (err, requester) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only Admin can view agents' });
        }
        db.all(`SELECT id, name, email, phone, district FROM users WHERE role = 'agent' ORDER BY district ASC`, (e2, rows) => {
            if (e2) return res.status(500).json({ error: 'Database error' });
            res.json(rows);
        });
    });
});

// Delete agent (Admin only)
app.delete('/api/admin/agents/:agentId', (req, res) => {
    const { agentId } = req.params;
    const { requesterId } = req.body;
    
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    
    db.get(`SELECT role FROM users WHERE id = ?`, [requesterId], (err, requester) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only Admin can delete agents' });
        }
        
        db.run(`DELETE FROM users WHERE id = ? AND role = 'agent'`, [agentId], function(err2) {
            if (err2) return res.status(500).json({ error: 'Failed to delete agent' });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Agent not found' });
            }
            res.json({ success: true });
        });
    });
});

// Update agent (Admin only)
app.put('/api/admin/agents/:agentId', (req, res) => {
    const { agentId } = req.params;
    const { requesterId, district, name, phone } = req.body;
    
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    
    db.get(`SELECT role FROM users WHERE id = ?`, [requesterId], (err, requester) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only Admin can update agents' });
        }
        
        db.run(`UPDATE users SET district = ?, name = ?, phone = ? WHERE id = ? AND role = 'agent'`, 
            [district, name, phone, agentId], 
            function(err2) {
                if (err2) return res.status(500).json({ error: 'Failed to update agent' });
                res.json({ success: true });
            }
        );
    });
});

// ===== VEGETABLE CATEGORIES APIs =====

// Get all vegetables
app.get('/api/vegetables', (req, res) => {
    db.all(`SELECT * FROM vegetables`, (err, vegetables) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(vegetables);
    });
});

// Get single vegetable
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

// Get user's recent harvest updates
app.get('/api/harvest', (req, res) => {
    const { userId, vegetableId, limit = 10 } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    let query = `SELECT 
                    h.id,
                    h.vegetable_id,
                    v.name as vegetable_name,
                    v.emoji,
                    h.district,
                    h.quantity,
                    h.harvest_date,
                    h.created_at,
                    h.employee_id
                 FROM harvest_data h
                 JOIN vegetables v ON h.vegetable_id = v.id
                 WHERE h.employee_id = ?`;
    let params = [userId];

    if (vegetableId) {
        query += ` AND h.vegetable_id = ?`;
        params.push(vegetableId);
    }

    query += ` ORDER BY h.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    db.all(query, params, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(data || []);
    });
});

// Get harvest data for a vegetable (for chart)
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

// Add harvest data (Agents only)
app.post('/api/harvest', (req, res) => {
    const { vegetableId, district, quantity, harvestDate, userId } = req.body;

    if (!vegetableId || !district || !quantity || !harvestDate || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.get(`SELECT id, role, district as assignedDistrict FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user || user.role !== 'agent') {
            return res.status(403).json({ error: 'Only agents can add harvest data' });
        }
        if (String(user.assignedDistrict).toLowerCase() !== String(district).toLowerCase()) {
            return res.status(403).json({ error: 'Agent can only update their assigned district' });
        }

        db.run(
            `INSERT INTO harvest_data (vegetable_id, district, quantity, harvest_date, employee_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [vegetableId, district, quantity, harvestDate, userId],
            function(err2) {
                if (err2) {
                    return res.status(500).json({ error: 'Failed to add harvest data' });
                }
                res.json({ success: true, dataId: this.lastID });
            }
        );
    });
});

// Update harvest data (Agents only)
app.put('/api/harvest/:id', (req, res) => {
    const { id } = req.params;
    const { quantity, district, harvestDate, userId } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    db.get(`SELECT id, role, district as assignedDistrict FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user || user.role !== 'agent') {
            return res.status(403).json({ error: 'Only agents can update harvest data' });
        }
        if (String(user.assignedDistrict).toLowerCase() !== String(district).toLowerCase()) {
            return res.status(403).json({ error: 'Agent can only update their assigned district' });
        }
        db.run(
            `UPDATE harvest_data 
             SET quantity = ?, district = ?, harvest_date = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [quantity, district, harvestDate, id],
            (err2) => {
                if (err2) {
                    return res.status(500).json({ error: 'Failed to update harvest data' });
                }
                res.json({ success: true });
            }
        );
    });
});

// Delete harvest data (Agents only)
app.delete('/api/harvest/:id', (req, res) => {
    const { id } = req.params;
    const { userId, district } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    db.get(`SELECT id, role, district as assignedDistrict FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user || user.role !== 'agent') {
            return res.status(403).json({ error: 'Only agents can delete harvest data' });
        }
        if (district && String(user.assignedDistrict).toLowerCase() !== String(district).toLowerCase()) {
            return res.status(403).json({ error: 'Agent can only modify their assigned district' });
        }
        db.run(`DELETE FROM harvest_data WHERE id = ?`, [id], (err2) => {
            if (err2) {
                return res.status(500).json({ error: 'Failed to delete harvest data' });
            }
            res.json({ success: true });
        });
    });
});

// Get all districts
app.get('/api/districts', (req, res) => {
    const districts = [
        'Colombo','Gampaha','Kalutara',
        'Kandy','Matale','Nuwara Eliya',
        'Galle','Matara','Hambantota',
        'Jaffna','Kilinochchi','Mannar','Vavuniya','Mullaitivu',
        'Batticaloa','Ampara','Trincomalee',
        'Polonnaruwa','Anuradhapura',
        'Badulla','Monaragala',
        'Kurunegala','Puttalam',
        'Ratnapura','Kegalle'
    ];
    res.json(districts);
});

// ===== SERVER START =====
app.listen(PORT, () => {
    console.log(`
    =====================================
    🥬 VEG WASTAGE REDUCTION SYSTEM
    =====================================
    ✅ Server running on http://localhost:${PORT}
    ✅ Database: veg_waste.db
    ✅ Ready to reduce wastage in Sri Lanka!
    =====================================
    `);
});
