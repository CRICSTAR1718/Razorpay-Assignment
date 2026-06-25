// Minimal CORS middleware.
// Needed because the frontend is served from a different origin than the API.
// Allows cookies (credentials) and common headers used by fetch().

function corsMiddleware(req, res, next) {
    const allowedOrigin =
        process.env.CORS_ORIGIN ||
        'http://127.0.0.1:5500';

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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

