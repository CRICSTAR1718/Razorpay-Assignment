require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);
}

async function hasMigrationApplied(client, filename) {
    const res = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [filename]
    );
    return res.rows.length > 0;
}

async function recordMigrationApplied(client, filename) {
    await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [filename]
    );
}

async function runMigrations() {
    const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
    const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }  // required for Supabase
    });

    await client.connect();
    console.log('Connected to database...');

    await ensureMigrationsTable(client);

    for (const filename of files) {
        if (await hasMigrationApplied(client, filename)) {
            console.log(`Skipping (already applied): ${filename}`);
            continue;
        }

        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Applying migration: ${filename}`);

        await client.query('BEGIN');
        try {
            await client.query(sql);
            await recordMigrationApplied(client, filename);
            await client.query('COMMIT');
            console.log(`Done: ${filename}`);
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`Failed on: ${filename}`, err.message);
            throw err;
        }
    }

    console.log('All migrations applied successfully.');
    await client.end();
}

runMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});