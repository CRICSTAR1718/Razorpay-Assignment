

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

function getEnv(name, fallback) {
    return process.env[name] ?? fallback;
}

function ensureOrgEmail(email) {
    if (!email || typeof email !== 'string' || !email.endsWith('@org.com')) {
        const err = new Error('Email must end with @org.com');
        err.statusCode = 400;
        throw err;
    }
}

async function withDb(fn) {
    const client = new Client({
        host: getEnv('PGHOST', '127.0.0.1'),
        port: Number(getEnv('PGPORT', 5432)),
        database: getEnv('PGDATABASE', 'reimbursements'),
        user: getEnv('PGUSER', 'postgres'),
        password: getEnv('PGPASSWORD', ''),
    });

    await client.connect();
    try {
        return await fn(client);
    } finally {
        await client.end();
    }
}

async function register({ name, email, password }) {
    ensureOrgEmail(email);

    const hashedPassword = await bcrypt.hash(password, 10);

    return await withDb(async (client) => {
        // Use INSERT ... RETURNING so we can return the created user.
        // If the email already exists, return 409.
        const insertRes = await client.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'EMP')
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email, role`,
            [name, email, hashedPassword]
        );

        if (insertRes.rows.length === 0) {
            const err = new Error('Email already exists');
            err.statusCode = 409;
            throw err;
        }

        return {
            userId: insertRes.rows[0].id,
            name: insertRes.rows[0].name,
            email: insertRes.rows[0].email,
            role: insertRes.rows[0].role,
        };
    });
}

async function login({ email, password }, res) {
    ensureOrgEmail(email);

    return await withDb(async (client) => {
        const userRes = await client.query(
            'SELECT id, name, email, password, role FROM users WHERE email = $1',
            [email]
        );

        if (userRes.rows.length === 0) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }

        const user = userRes.rows[0];
        const ok = await bcrypt.compare(password, user.password);

        if (!ok) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }

        const jwtSecret = getEnv('JWT_SECRET', 'dev-secret');

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            // secure: true, // enable when deploying over HTTPS
        });

        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    });
}

async function logout(res) {
    res.clearCookie('auth_token', {
        httpOnly: true,
        sameSite: 'lax',
    });
}

module.exports = { register, login, logout };

