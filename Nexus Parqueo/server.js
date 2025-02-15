const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const app = express();

// Enable legacy OpenSSL provider
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_OPTIONS = '--openssl-legacy-provider';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// SQL Server configuration
const config = {
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'testLogin',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        trustedConnection: true,
        integratedSecurity: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        rowCollectionOnRequestCompletion: true
    },
    driver: 'tedious',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Log configuration (excluding sensitive data)
console.log('Environment Variables Loaded:', {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER ? '[SET]' : '[NOT SET]'
});

// Test database connection
const testDatabaseConnection = async () => {
    try {
        console.log('Testing database connection...');
        await sql.connect(config);
        const result = await sql.query('SELECT GETDATE() as currentTime');
        console.log('Database connection test successful:', result.recordset[0].currentTime);
        await sql.close();
        return true;
    } catch (err) {
        console.error('Database connection test failed:', err);
        return false;
    }
};

// Test endpoint
app.get('/test', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT GETDATE() as currentTime');
        await sql.close();
        res.json({
            message: 'Server is running',
            dbConnected: true,
            currentTime: result.recordset[0].currentTime
        });
    } catch (err) {
        res.status(500).json({
            message: 'Server is running but database connection failed',
            dbConnected: false,
            error: err.message
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    console.log('Login attempt received:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({
            error: 'Username and password are required'
        });
    }

    try {
        console.log('Attempting database connection...');
        await sql.connect(config);
        console.log('Database connected successfully');

        const result = await sql.query`
            SELECT id, username, password_hash 
            FROM Users 
            WHERE username = ${username}
        `;

        console.log('Query executed successfully');
        const user = result.recordset[0];

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful for user:', username);
        res.json({
            message: 'Login successful',
            username: user.username
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            error: 'Database connection failed',
            details: err.message
        });
    } finally {
        try {
            await sql.close();
        } catch (err) {
            console.error('Error closing database connection:', err);
        }
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Frontend running on http://localhost:5173');
    console.log('Testing database connection...');
    await testDatabaseConnection();
});