const express = require('express');
const cors = require('cors');
const sql = require('msnodesqlv8');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());

const connectionString = "server=localhost;Database=testLogin;Trusted_Connection=Yes;Driver={SQL Server}";
const SALTS = 12;


const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    try {
        const query = "SELECT * FROM Users WHERE username = ?";
        const rows = await queryAsync(query, [username]);
        
        // Debug logging
        console.log('Query results:', rows);
        console.log('First user:', rows?.[0]);

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña invalido' });
        }

        const user = rows[0];
        
        // Debug logging
        console.log('User object:', user);
        console.log('Password hash:', user.password_hash);

        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(401).json({ error: 'Usuario o contraseña invalido' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});

// Registration 
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const queryAsync = (query, params) => {
        return new Promise((resolve, reject) => {
            sql.query(connectionString, query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        // Check if user already exists
        const checkQuery = "SELECT * FROM Users WHERE username = ?";
        const existingUsers = await queryAsync(checkQuery, [username]);

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ error: 'Ya existe el usuario' });
        }

        const hashedPassword = await bcrypt.hash(password, SALTS);

        const insertQuery = "INSERT INTO Users (username, password_hash) VALUES (?, ?)";
        await queryAsync(insertQuery, [username, hashedPassword]);

        res.status(201).json({ message: 'Usuario creado con exito' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});