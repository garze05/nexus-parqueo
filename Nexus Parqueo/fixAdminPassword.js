const sql = require('msnodesqlv8');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection string
const connectionString = process.env.DB_CONNECTION_STRING || 
    "server=localhost;Database=ParqueoUlacit;Trusted_Connection=Yes;Driver={SQL Server}";

const SALT_ROUNDS = 12;

// Helper function for SQL queries
const queryAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Function to update admin user's password with hashed version
const fixAdminPassword = async () => {
    try {
        console.log('Starting admin password fix...');
        
        // Check if admin user exists
        console.log('Checking admin user...');
        const checkQuery = "SELECT usuario_id, clave FROM Usuario WHERE correo_electronico = 'admin@ulacit.ac.cr'";
        const user = await queryAsync(checkQuery);
        
        if (!user || user.length === 0) {
            console.log('Admin user not found. Please run the initAdminUser.js script first.');
            return;
        }
        
        console.log('Admin user found. Checking password format...');
        
        // Get the current password
        const currentPassword = user[0].clave;
        
        // Check if the password is already hashed
        // bcrypt hashes start with $2b$, $2y$ or $2a$
        if (currentPassword.startsWith('$2')) {
            console.log('Password is already properly hashed. No action needed.');
            return;
        }
        
        console.log('Password is not hashed correctly. Updating with bcrypt hash...');
        
        // Hash the default password
        const defaultPassword = 'Ulacit123';
        const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
        
        // Update admin user password
        const updateQuery = `
            UPDATE Usuario
            SET clave = ?
            WHERE usuario_id = ?
        `;
        
        await queryAsync(updateQuery, [hashedPassword, user[0].usuario_id]);
        
        console.log('Admin password updated successfully!');
        console.log('Username: admin@ulacit.ac.cr');
        console.log('Password: Ulacit123');
        
    } catch (error) {
        console.error('Error updating admin password:', error);
    }
};

// Make sure the database connection works
console.log('Testing database connection...');
sql.open(connectionString, (err, conn) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.log('Please check your connection string and make sure SQL Server is running.');
        return;
    }
    
    console.log('Database connection successful!');
    console.log('Connection string:', connectionString);
    
    // Execute the admin password fix
    fixAdminPassword()
        .then(() => {
            console.log('Script completed.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Script failed:', err);
            process.exit(1);
        });
});