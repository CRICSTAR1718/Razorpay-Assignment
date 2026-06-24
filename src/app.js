const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());

const onboardingsRoutes = require('./routes/onboardings.routes');
const rolesRoutes = require('./routes/roles.routes');
const employeesRoutes = require('./routes/employees.routes');
const reimbursementsRoutes = require('./routes/reimbursements.routes');
const reimbursementsApprovalsRoutes = require('./routes/reimbursements.approvals.routes');

app.use('/rest/onboardings', onboardingsRoutes);
app.use('/rest/roles', rolesRoutes);
app.use('/rest/employees', employeesRoutes);
app.use('/rest/reimbursements', reimbursementsRoutes);
app.use('/rest/reimbursements', reimbursementsApprovalsRoutes);


module.exports = app;









