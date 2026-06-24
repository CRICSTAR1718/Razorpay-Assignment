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

function validateCreate({ title, amount }) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        const err = new Error('title is required');
        err.statusCode = 400;
        throw err;
    }

    const num = typeof amount === 'string' || typeof amount === 'number' ? Number(amount) : NaN;
    if (!Number.isFinite(num) || num <= 0) {
        const err = new Error('amount must be a positive number');
        err.statusCode = 400;
        throw err;
    }

    return { title: title.trim(), amount: num };
}

async function getAnyManagerForEmployee(client, employeeId) {
    const res = await client.query(
        `SELECT manager_id
         FROM employee_manager_map
         WHERE employee_id = $1
         LIMIT 1`,
        [employeeId]
    );
    return res.rows.length > 0 ? res.rows[0].manager_id : null;
}

async function insertReimbursement(client, { employeeId, title, description, amount }) {
    const insertRes = await client.query(
        `INSERT INTO reimbursements (employee_id, title, description, amount, status)
         VALUES ($1, $2, $3, $4, 'PENDING')
         RETURNING id, title, description, amount, status`,
        [employeeId, title, description ?? null, amount]
    );

    const row = insertRes.rows[0];
    return {
        reimbursementId: row.id,
        title: row.title,
        description: row.description,
        amount: Number(row.amount),
        status: row.status,
    };
}

async function createReimbursement({ employeeId, title, description, amount }) {
    if (!employeeId) {
        const err = new Error('employeeId missing');
        err.statusCode = 400;
        throw err;
    }

    const validated = validateCreate({ title, amount });

    return await withDb(async (client) => {
        const hasManager = await getAnyManagerForEmployee(client, employeeId);
        if (!hasManager) {
            const err = new Error(
                'You must be assigned to a Reporting Manager before raising a reimbursement'
            );
            err.statusCode = 400;
            throw err;
        }

        return await insertReimbursement(client, {
            employeeId,
            title: validated.title,
            description,
            amount: validated.amount,
        });
    });
}

// Encapsulated status-update logic for APPROVED flow
async function computeStatusAfterApproval({ client, reimbursementId }) {
    const rmApproved = await client.query(
        `SELECT 1
         FROM reimbursement_approvals
         WHERE reimbursement_id = $1
           AND action = 'APPROVED'
           AND approver_role = 'RM'
         LIMIT 1`,
        [reimbursementId]
    );

    const apeApproved = await client.query(
        `SELECT 1
         FROM reimbursement_approvals
         WHERE reimbursement_id = $1
           AND action = 'APPROVED'
           AND approver_role = 'APE'
         LIMIT 1`,
        [reimbursementId]
    );

    if (rmApproved.rows.length > 0 && apeApproved.rows.length > 0) {
        await client.query(
            `UPDATE reimbursements
             SET status = 'APPROVED', updated_at = NOW()
             WHERE id = $1`,
            [reimbursementId]
        );
        return 'APPROVED';
    }

    // Otherwise keep as PENDING
    await client.query(
        `UPDATE reimbursements
         SET updated_at = NOW()
         WHERE id = $1`,
        [reimbursementId]
    );

    return 'PENDING';
}

async function actOnReimbursement({ reimbursementId, action, approverUserId, approverRole }) {
    const validActions = ['APPROVED', 'REJECTED'];
    if (!reimbursementId) {
        const err = new Error('reimbursementId is required');
        err.statusCode = 400;
        throw err;
    }

    if (!validActions.includes(action)) {
        const err = new Error('Invalid action');
        err.statusCode = 400;
        throw err;
    }

    if (!approverUserId) {
        const err = new Error('approverUserId is required');
        err.statusCode = 400;
        throw err;
    }

    return await withDb(async (client) => {
        // 1) Fetch reimbursement
        const reimbursementRes = await client.query(
            `SELECT id, employee_id, status
             FROM reimbursements
             WHERE id = $1`,
            [reimbursementId]
        );

        if (reimbursementRes.rows.length === 0) {
            const err = new Error('Reimbursement not found');
            err.statusCode = 404;
            throw err;
        }

        const reimbursement = reimbursementRes.rows[0];

        if (reimbursement.status === 'REJECTED') {
            const err = new Error('Cannot act on a rejected reimbursement');
            err.statusCode = 400;
            throw err;
        }

        if (reimbursement.status === 'APPROVED') {
            const err = new Error('Cannot act on an approved reimbursement');
            err.statusCode = 400;
            throw err;
        }

        // 2) Role-specific access rules
        if (approverRole === 'RM') {
            // RM can only act on reimbursements raised by their assigned EMPs
            const membershipRes = await client.query(
                `SELECT 1
                 FROM employee_manager_map
                 WHERE manager_id = $1
                   AND employee_id = $2
                 LIMIT 1`,
                [approverUserId, reimbursement.employee_id]
            );

            if (membershipRes.rows.length === 0) {
                const err = new Error('Forbidden');
                err.statusCode = 403;
                throw err;
            }
        }

        if (approverRole === 'APE') {
            // APE can only act after RM has approved
            const rmApprovedRes = await client.query(
                `SELECT 1
                 FROM reimbursement_approvals
                 WHERE reimbursement_id = $1
                   AND action = 'APPROVED'
                   AND approver_role = 'RM'
                 LIMIT 1`,
                [reimbursementId]
            );

            if (rmApprovedRes.rows.length === 0) {
                const err = new Error('RM has not approved yet');
                err.statusCode = 400;
                throw err;
            }
        }

        // 3) Duplicate approval check (same approver)
        const duplicateRes = await client.query(
            `SELECT 1
             FROM reimbursement_approvals
             WHERE reimbursement_id = $1
               AND approver_id = $2
             LIMIT 1`,
            [reimbursementId, approverUserId]
        );

        if (duplicateRes.rows.length > 0) {
            const err = new Error('You have already acted on this reimbursement');
            err.statusCode = 400;
            throw err;
        }

        // 4) Insert into reimbursement_approvals
        await client.query(
            `INSERT INTO reimbursement_approvals
               (reimbursement_id, approver_id, approver_role, action, remarks)
             VALUES ($1, $2, $3, $4, NULL)`,
            [reimbursementId, approverUserId, approverRole, action]
        );

        // 5) Update reimbursement status
        if (action === 'REJECTED') {
            await client.query(
                `UPDATE reimbursements
                 SET status = 'REJECTED', updated_at = NOW()
                 WHERE id = $1`,
                [reimbursementId]
            );
            return { status: 'REJECTED' };
        }

        // action === APPROVED
        const newStatus = await computeStatusAfterApproval({
            client,
            reimbursementId,
        });

        return { status: newStatus };
    });
}

module.exports = { createReimbursement, actOnReimbursement };


