function sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({ status: 'error', message });
}

// JSON parse errors from express.json()
function jsonParseErrorHandler(err, req, res, next) {
    if (err && err.type === 'entity.parse.failed') {
        return sendError(res, 'Malformed JSON', 400);
    }

    return next(err);
}

function notFoundHandler(req, res) {
    return sendError(res, 'Route not found', 404);
}

function globalErrorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err?.statusCode ?? 400;
    const message = err?.message ?? 'Something went wrong';
    return sendError(res, message, statusCode);
}

module.exports = {
    jsonParseErrorHandler,
    notFoundHandler,
    globalErrorHandler,
};

