const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const employeesController = require('../controllers/employees/employees.controller');

const router = express.Router();

router.post(
    '/assign',
    authenticate,
    authorizeRoles('CFO'),
    employeesController.assignEmployeeToManager
);

router.delete(
    '/assign',
    authenticate,
    authorizeRoles('CFO'),
    employeesController.removeEmployeeManagerAssignment
);

router.get(
    '/',
    authenticate,
    authorizeRoles('RM', 'APE', 'CFO'),
    employeesController.getEmployeesByRoleVisibility
);

module.exports = router;

