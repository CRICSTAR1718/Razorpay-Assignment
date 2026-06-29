// Minimal CORS middleware.
// Needed because the frontend is served from a different origin than the API.
// Allows cookies (credentials) and common headers used by fetch().

function corsMiddleware(req, res, next) {
    // With credentials (cookies), Access-Control-Allow-Origin MUST NOT be '*'.
    // Echo back the request Origin only when it's our known frontend origin.
    const requestOrigin = req.headers.origin;
    const allowedOrigin = 'http://localhost:5173';

    if (requestOrigin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, PUT, DELETE, OPTIONS'
    );

    if (req.method === 'OPTIONS') {
        // Preflight
        res.status(204).end();
        return;
    }

    return next();
}

module.exports = corsMiddleware;


