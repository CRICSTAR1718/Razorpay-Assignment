const { Client } = require('pg');

function getEnv(name, fallback) {
    return process.env[name] ?? fallback;
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

async function getUserByIdAndRole(client, id, expectedRole) {
    const res = await client.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const user = res.rows[0];
    if (user.role !== expectedRole) return { ...user, _roleMismatch: true };
    return user;
}

async function assignEmployeeToManager({ empId, rmId }) {
    if (!empId || !rmId) {
        const err = new Error('empId and rmId are required');
        err.statusCode = 400;
        throw err;
    }

    return await withDb(async (client) => {
        // Validate empId exists and role EMP
        const empRes = await client.query('SELECT id, role FROM users WHERE id = $1', [empId]);
        if (empRes.rows.length === 0 || empRes.rows[0].role !== 'EMP') {
            const err = new Error('empId must exist and have role EMP');
            err.statusCode = 400;
            throw err;
        }

        // Validate rmId exists and role RM
        const rmRes = await client.query('SELECT id, role FROM users WHERE id = $1', [rmId]);
        if (rmRes.rows.length === 0 || rmRes.rows[0].role !== 'RM') {
            const err = new Error('rmId must exist and have role RM');
            err.statusCode = 400;
            throw err;
        }

        // Check if emp already assigned (employee_id UNIQUE)
        const existing = await client.query(
            'SELECT employee_id FROM employee_manager_map WHERE employee_id = $1',
            [empId]
        );

        if (existing.rows.length > 0) {
            const err = new Error('Employee already assigned to a manager');
            err.statusCode = 409;
            throw err;
        }

        await client.query(
            'INSERT INTO employee_manager_map (employee_id, manager_id) VALUES ($1, $2)',
            [empId, rmId]
        );
    });
}

async function removeEmployeeManagerAssignment({ empId, rmId }) {
    if (!empId || !rmId) {
        const err = new Error('empId and rmId are required');
        err.statusCode = 400;
        throw err;
    }

    return await withDb(async (client) => {
        // Verify mapping exists
        const mappingRes = await client.query(
            'SELECT id FROM employee_manager_map WHERE employee_id = $1 AND manager_id = $2',
            [empId, rmId]
        );

        if (mappingRes.rows.length === 0) {
            const err = new Error('Assignment not found');
            err.statusCode = 404;
            throw err;
        }

        await client.query(
            'DELETE FROM employee_manager_map WHERE employee_id = $1 AND manager_id = $2',
            [empId, rmId]
        );
    });
}

module.exports = {
    assignEmployeeToManager,
    removeEmployeeManagerAssignment,
};

