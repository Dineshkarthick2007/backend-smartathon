// ─────────────────────────────────────────────────────────────────────────────
// Ulavan Smart Agriculture — Auth Backend Server
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Load environment variables FIRST, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const irrigationRoutes = require('./routes/irrigationRoutes');
const { startDailyScheduler } = require('./scheduler/dailyScheduler');

// ─── Connect to MongoDB Atlas ─────────────────────────────────────────────────
connectDB();

// ─── Initialise Express App ───────────────────────────────────────────────────
const app = express();

// ─── CORS Configuration ───────────────────────────────────────────────────────
// Allow all origins so mobile clients can connect from the internet.
// For tighter production security, replace '*' with your specific domain.
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
};
app.use(cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check Route ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🌾 Ulavan Smart Agriculture Auth API is running.',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/irrigation', irrigationRoutes);

// ─── Start Scheduler ──────────────────────────────────────────────────────────
startDailyScheduler();

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled Error:', err.stack);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'An unexpected error occurred.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🌾 ═══════════════════════════════════════════════════');
    console.log('   Ulavan Smart Agriculture Auth Backend');
    console.log('🌾 ═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔐 Auth Endpoint: POST http://localhost:${PORT}/api/auth/google`);
    console.log(`❤️  Health Check: GET  http://localhost:${PORT}/health`);
    console.log('🌾 ═══════════════════════════════════════════════════');
    console.log('');
});

// ─── Handle Unhandled Promise Rejections ─────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Promise Rejection:', reason);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
