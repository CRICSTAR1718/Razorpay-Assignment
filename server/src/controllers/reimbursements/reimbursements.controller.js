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

async function getReimbursementsForLoggedInRole(req, res) {
    try {
        const role = req.user?.role;
        const userId = req.user?.userId;

        const reimbursements = await reimbursementsService.getReimbursementsForRole({
            role,
            userId,
        });

        return res.status(200).json({
            status: 'success',
            data: {
                reimbursements: reimbursements.map((r) => ({
                    reimbursementId: r.id,
                    title: r.title,
                    description: r.description,
                    amount: Number(r.amount),
                    status: r.status,
                })),
            },
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Failed to fetch reimbursements', statusCode);
    }
}

async function getReimbursementsForUser(req, res) {
    try {
        const targetUserId = req.params.userId;

        const reimbursements = await reimbursementsService.getReimbursementsForTargetUser({
            targetUserId,
            requesterUserId: req.user.userId,
            requesterRole: req.user.role,
        });

        return res.status(200).json({
            status: 'success',
            data: {
                reimbursements: reimbursements.map((r) => ({
                    reimbursementId: r.id,
                    title: r.title,
                    description: r.description,
                    amount: Number(r.amount),
                    status: r.status,
                })),
            },
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Failed to fetch user reimbursements', statusCode);
    }
}

module.exports = {
    createReimbursement,
    actOnReimbursement,
    getReimbursementsForLoggedInRole,
    getReimbursementsForUser,
};


