const authService = require('../../services/onboardings/auth.service');

function sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({ status: 'error', message });
}

async function register(req, res) {
    try {
        const result = await authService.register(req.body);
        return res.status(201).json({ status: 'success', data: result });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Registration failed', statusCode);
    }
}

async function login(req, res) {
    try {
        const result = await authService.login(req.body, res);
        return res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Login failed', statusCode);
    }
}

async function logout(req, res) {
    try {
        await authService.logout(res);
        return res.status(200).json({ status: 'success', data: {} });
    } catch (err) {
        const statusCode = err?.statusCode ?? 400;
        return sendError(res, err?.message ?? 'Logout failed', statusCode);
    }
}

module.exports = { register, login, logout };

