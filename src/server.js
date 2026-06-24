require('dotenv/config');

const app = require('./app');

const PORT = 7002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

