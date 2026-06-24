const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const reimbursementsController = require('../controllers/reimbursements/reimbursements.controller');

const router = express.Router();

router.patch(
    '/',
    authenticate,
    authorizeRoles('RM', 'APE', 'CFO'),
    reimbursementsController.actOnReimbursement
);

module.exports = router;

