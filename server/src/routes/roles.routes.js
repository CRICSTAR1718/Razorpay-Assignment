const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const rolesController = require('../controllers/roles/roles.controller');

const router = express.Router();

router.post(
    '/assign',
    authenticate,
    authorizeRoles('CFO'),
    rolesController.assignRole
);

module.exports = router;

