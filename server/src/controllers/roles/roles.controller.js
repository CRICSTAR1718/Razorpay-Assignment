const rolesService = require('../../services/roles/roles.service');

function sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({ status: 'error', message });
}

async function assignRole(req, res) {
    try {
        const { userId, role } = req.body;

        const result = await rolesService.assignRole({ userId, role });

        return res.status(200).json({
            status: 'success',
            data: {
                userId: result.userId,
                role: result.role,
            },
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Role assignment failed', statusCode);
    }
}

module.exports = { assignRole };

