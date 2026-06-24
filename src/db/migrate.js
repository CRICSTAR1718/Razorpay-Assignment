

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getEnv(name, fallback) {
    return process.env[name] ?? fallback;
}

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
        host: getEnv('PGHOST', 'localhost'),
        port: Number(getEnv('PGPORT', 5432)),
        database: getEnv('PGDATABASE', 'reimbursements'),
        user: getEnv('PGUSER', 'postgres'),
        password: getEnv('PGPASSWORD', ''),
    });

    await client.connect();
    await ensureMigrationsTable(client);

    for (const filename of files) {
        if (await hasMigrationApplied(client, filename)) continue;

        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Applying migration: ${filename}`);

        await client.query('BEGIN');
        try {
            await client.query(sql);
            await recordMigrationApplied(client, filename);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
    }

    await client.end();
}

runMigrations().catch((err) => {
    console.error(err);
    process.exit(1);
});

