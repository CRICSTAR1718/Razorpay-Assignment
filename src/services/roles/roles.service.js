const pool = require('../../db/pool');

function getEnv(name, fallback) {
    return process.env[name] ?? fallback;
}

async function withDb(fn) {
    const client = await pool.connect();
    try {
        return await fn(client);
    } finally {
        client.release();
    }
}


const VALID_ROLES = ['EMP', 'RM', 'APE', 'CFO'];

async function assignRole({ userId, role }) {
    if (!userId) {
        const err = new Error('userId is required');
        err.statusCode = 400;
        throw err;
    }

    if (!role || !VALID_ROLES.includes(role)) {
        const err = new Error('Invalid role');
        err.statusCode = 400;
        throw err;
    }

    return await withDb(async (client) => {

        const userRes = await client.query('SELECT id FROM users WHERE id = $1', [userId]);

        if (userRes.rows.length === 0) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }

        await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

        return { userId, role };
    });
}

module.exports = { assignRole };

