const jwt = require('jsonwebtoken');

function getEnv(name, fallback) {
    return process.env[name] ?? fallback;
}

function authenticate(req, res, next) {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            return res
                .status(401)
                .json({ status: 'error', message: 'Unauthorized' });
        }

        const jwtSecret = getEnv('JWT_SECRET', 'dev-secret');
        const decoded = jwt.verify(token, jwtSecret);

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        return next();
    } catch (err) {
        return res
            .status(401)
            .json({ status: 'error', message: 'Unauthorized' });
    }
}

module.exports = authenticate;

