require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }  // required for Supabase
    });

    await client.connect();
    console.log('Connected to database...');

    const hashedPassword = await bcrypt.hash('CFO#ORG@April2026', 10);

    await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        ['CFO', 'cfo@org.com', hashedPassword, 'CFO']
    );

    console.log('CFO user seeded successfully.');
    await client.end();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});