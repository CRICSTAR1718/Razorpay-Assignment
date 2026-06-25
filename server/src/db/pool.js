require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function testConnection() {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

testConnection();

module.exports = pool;


