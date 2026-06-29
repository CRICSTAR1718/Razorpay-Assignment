const express = require('express');

const router = express.Router();

// Simple health endpoint for load balancers/dev checks
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router;

