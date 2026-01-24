// Optional: Script to add sample data to database
// Run this after server starts if you want pre-populated data

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, '../veg_waste.db');
const db = new sqlite3.Database(DB_PATH);

// Sample users
const sampleUsers = [
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

// Sample harvest data
const sampleHarvest = [
    { veg_id: 1, district: 'Colombo', quantity: 500, harvest_date: '2026-01-14', employee_id: 1 },
    { veg_id: 1, district: 'Galle', quantity: 300, harvest_date: '2026-01-14', employee_id: 2 },
    { veg_id: 1, district: 'Matara', quantity: 200, harvest_date: '2026-01-14', employee_id: 1 },
    { veg_id: 2, district: 'Colombo', quantity: 750, harvest_date: '2026-01-15', employee_id: 1 },
    { veg_id: 2, district: 'Kandy', quantity: 600, harvest_date: '2026-01-15', employee_id: 2 },
    { veg_id: 3, district: 'Galle', quantity: 400, harvest_date: '2026-01-15', employee_id: 2 },
];

function insertSampleData() {
    console.log('Adding sample data...');

    // Insert sample users
    sampleUsers.forEach(user => {
        db.run(
            `INSERT OR IGNORE INTO users (email, password, name, phone, role, district) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user.email, user.password, user.name, user.phone, user.role, user.district],
            function(err) {
                if (err) console.error('Error inserting user:', err.message);
                else console.log(`✅ Added user: ${user.name}`);
            }
        );
    });

    // Insert sample harvest data
    setTimeout(() => {
        sampleHarvest.forEach(harvest => {
            db.run(
                `INSERT INTO harvest_data (vegetable_id, district, quantity, harvest_date, employee_id) 
                 VALUES (?, ?, ?, ?, ?)`,
                [harvest.veg_id, harvest.district, harvest.quantity, harvest.harvest_date, harvest.employee_id],
                function(err) {
                    if (err) console.error('Error inserting harvest data:', err.message);
                    else console.log(`✅ Added harvest data for ${harvest.district}`);
                }
            );
        });
        console.log('✅ Sample data insertion complete!');
    }, 1000);
}

// Uncomment to run:
// insertSampleData();

// Or run from command line:
// node seed-data.js
if (require.main === module) {
    insertSampleData();
    setTimeout(() => {
        db.close();
        process.exit(0);
    }, 3000);
}
