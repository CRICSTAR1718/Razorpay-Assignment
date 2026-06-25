function authorizeRoles(...allowedRoles) {
    const normalized = allowedRoles.flat().filter(Boolean);

    return function (req, res, next) {
        const userRole = req.user?.role;

        if (!normalized.includes(userRole)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        return next();
    };
}

module.exports = authorizeRoles;

