const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const eventRoutes = require('./routes/eventRoutes');



const app = express();

// ─── Middleware ────────────────────────────────────────────────
// Parse incoming JSON request bodies
app.use(express.json());

// Parse cookies from incoming requests (needed to read JWT cookie)
app.use(cookieParser());

// CORS: Allow frontend (port 5173) to send requests WITH cookies
app.use(cors({
    origin: 'http://localhost:5173',   // Vite frontend URL
    credentials: true                   // Allow cookies to be sent cross-origin
}));

// ─── Routes ───────────────────────────────────────────────────
app.use('/test', testRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/companies', companyRoutes);

app.use('/api/users', userRoutes);

app.use('/api/organizer', organizerRoutes);

app.use('/api/events', eventRoutes);

// Root health check
app.get('/', (req, res) => {
    res.json({ message: "Event Management API is running" });
});

module.exports = app;
