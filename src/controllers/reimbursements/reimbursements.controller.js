const reimbursementsService = require('../../services/reimbursements/reimbursements.service');

function sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({ status: 'error', message });
}

async function createReimbursement(req, res) {
    try {
        const { title, description, amount } = req.body;

        const reimbursement = await reimbursementsService.createReimbursement({
            employeeId: req.user.userId,
            title,
            description,
            amount,
        });

        return res.status(201).json({
            status: 'success',
            data: reimbursement,
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Reimbursement creation failed', statusCode);
    }
}

async function actOnReimbursement(req, res) {
    try {
        const { reimbursementId, action } = req.body;

        const result = await reimbursementsService.actOnReimbursement({
            reimbursementId,
            action,
            approverUserId: req.user.userId,
            approverRole: req.user.role,
        });

        return res.status(200).json({
            status: 'success',
            data: {
                reimbursementId,
                status: result.status,
            },
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Reimbursement approval failed', statusCode);
    }
}

module.exports = { createReimbursement, actOnReimbursement };

