const pool = require('../../db/pool');

async function withDb(fn) {
    const client = await pool.connect();
    try {
        return await fn(client);
    } finally {
        client.release();
    }
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
        const existing = await client.query('SELECT employee_id FROM employee_manager_map WHERE employee_id = $1', [empId]);

        if (existing.rows.length > 0) {
            const err = new Error('Employee already assigned to a manager');
            err.statusCode = 409;
            throw err;
        }

        await client.query('INSERT INTO employee_manager_map (employee_id, manager_id) VALUES ($1, $2)', [empId, rmId]);
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

        await client.query('DELETE FROM employee_manager_map WHERE employee_id = $1 AND manager_id = $2', [empId, rmId]);
    });
}

// Isolated role-specific queries
async function getUsersForRm(client, managerId) {
    const res = await client.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM users u
         INNER JOIN employee_manager_map emm ON emm.employee_id = u.id
         WHERE emm.manager_id = $1 AND u.role = 'EMP'`,
        [managerId]
    );
    return res.rows;
}

async function getUsersForApe(client) {
    const res = await client.query(
        `SELECT id, name, email, role
         FROM users
         WHERE role IN ('EMP', 'RM')`
    );
    return res.rows;
}

async function getUsersForCfo(client) {
    const res = await client.query(`SELECT id, name, email, role FROM users`);
    return res.rows;
}

async function getUsersByRoleVisibility({ role, userId }) {
    if (!role) {
        const err = new Error('role missing');
        err.statusCode = 400;
        throw err;
    }

    return await withDb(async (client) => {
        if (role === 'RM') {
            return await getUsersForRm(client, userId);
        }
        if (role === 'APE') {
            return await getUsersForApe(client);
        }
        if (role === 'CFO') {
            return await getUsersForCfo(client);
        }

        const err = new Error('Forbidden');
        err.statusCode = 403;
        throw err;
    });
}

module.exports = {
    assignEmployeeToManager,
    removeEmployeeManagerAssignment,
    getUsersByRoleVisibility,
};

