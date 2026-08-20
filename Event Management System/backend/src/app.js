const express = require('express');
const testRoutes = require('./routes/testRoutes');

const app = express();

app.use(express.json());

// Mount API routes
app.use('/test', testRoutes);

// Simple root route
app.get('/', (req, res) => {
    res.json({ message: "Event Management API is running" });
});

module.exports = app;