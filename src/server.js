
const app = require('./app');


const PORT = 'https://razorpay-assignment.onrender.com' || 7002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

