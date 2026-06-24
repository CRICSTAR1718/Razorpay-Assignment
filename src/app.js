const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());

const onboardingsRoutes = require('./routes/onboardings.routes');

app.use('/rest/onboardings', onboardingsRoutes);

module.exports = app;


