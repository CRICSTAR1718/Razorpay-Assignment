

const bcrypt = require('bcrypt');
const { Client } = require('pg');

function getEnv(name, fallback) {
    return process.env[name] ?? fallback;
}

async function main() {
    const client = new Client({
        host: getEnv('PGHOST', 'localhost'),
        port: Number(getEnv('PGPORT', 5432)),
        database: getEnv('PGDATABASE', 'reimbursements'),
        user: getEnv('PGUSER', 'postgres'),
        password: getEnv('PGPASSWORD', ''),
    });

    await client.connect();

    const hashedPassword = await bcrypt.hash(
        'CFO#ORG@April2026',
        10
    );

    await client.query(
        `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
        ['CFO', 'cfo@org.com', hashedPassword, 'CFO']
    );

    await client.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

