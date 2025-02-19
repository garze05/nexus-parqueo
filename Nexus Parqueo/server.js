// server.js
const express = require('express');
const cors = require('cors');
const sql = require('msnodesqlv8');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: 'its my secret',
    cookie: { maxAge: 60000 }, // value of maxAge is defined in milliseconds. 
    resave: false,
    rolling: false,
    saveUninitialized: true
  }))

const connectionString = "server=localhost;Database=testLogin;Trusted_Connection=Yes;Driver={SQL Server}";
const salts = 10; 


// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const query = "SELECT * FROM Users WHERE username = ?";

    sql.query(connectionString, query, [username], (err, rows) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        const user = rows[0];

        // Compare password using bcrypt instead of plain text
        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err) {
                console.error('Bcrypt Error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!match) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        });
    });
});

// Registration endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Check if user already exists
    const checkQuery = "SELECT * FROM Users WHERE username = ?";
    sql.query(connectionString, checkQuery, [username], (err, rows) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (rows && rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password with bcrypt before inserting
        bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
            if (err) {
                console.error('Bcrypt Error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Insert new user with hashed password
            const insertQuery = "INSERT INTO Users (username, password_hash) VALUES (?, ?)";
            sql.query(connectionString, insertQuery, [username, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Database Error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                res.status(201).json({ message: 'User created successfully' });
            });
        });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});