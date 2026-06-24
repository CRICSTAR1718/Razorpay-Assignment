const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const reimbursementsController = require('../controllers/reimbursements/reimbursements.controller');

const router = express.Router();

router.get(
    '/',
    authenticate,
    reimbursementsController.getReimbursementsForLoggedInRole
);

router.get(
    '/:userId',
    authenticate,
    authorizeRoles('RM', 'APE', 'CFO'),
    reimbursementsController.getReimbursementsForUser
);

module.exports = router;

