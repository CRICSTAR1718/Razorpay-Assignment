const employeesService = require('../../services/employees/employees.service');

function sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({ status: 'error', message });
}

async function assignEmployeeToManager(req, res) {
    try {
        const { empId, rmId } = req.body;

        await employeesService.assignEmployeeToManager({ empId, rmId });

        return res.status(200).json({
            status: 'success',
            message: 'Employee assigned to manager successfully',
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Employee assignment failed', statusCode);
    }
}

async function removeEmployeeManagerAssignment(req, res) {
    try {
        const { empId, rmId } = req.body;

        await employeesService.removeEmployeeManagerAssignment({ empId, rmId });

        return res.status(200).json({
            status: 'success',
            message: 'Assignment removed successfully',
        });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Remove assignment failed', statusCode);
    }
}

module.exports = {
    assignEmployeeToManager,
    removeEmployeeManagerAssignment,
};

