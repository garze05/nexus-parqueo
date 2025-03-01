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

// Function to insert admin user
const insertAdminUser = async () => {
    try {
        console.log('Starting admin user creation process...');
        
        // Check if admin user exists
        console.log('Checking if admin user already exists...');
        const checkQuery = "SELECT COUNT(*) AS count FROM Usuario WHERE correo_electronico = 'admin@ulacit.ac.cr'";
        const checkResult = await queryAsync(checkQuery);
        
        if (checkResult[0]?.count > 0) {
            console.log('Admin user already exists. No action needed.');
            return;
        }
        
        // Check if Rol table has the admin role
        console.log('Checking if admin role exists...');
        const checkRoleQuery = "SELECT rol_id FROM Rol WHERE nombre_rol = 'ADMINISTRADOR'";
        const roleResult = await queryAsync(checkRoleQuery);
        
        let adminRoleId;
        
        if (!roleResult || roleResult.length === 0) {
            // Create admin role if it doesn't exist
            console.log('Admin role does not exist. Creating it...');
            const insertRoleQuery = "INSERT INTO Rol (nombre_rol, descripcion) VALUES ('ADMINISTRADOR', 'Administrador del sistema')";
            await queryAsync(insertRoleQuery);
            
            // Get the new role ID
            const newRoleResult = await queryAsync(checkRoleQuery);
            adminRoleId = newRoleResult[0].rol_id;
        } else {
            adminRoleId = roleResult[0].rol_id;
        }
        
        console.log(`Using admin role ID: ${adminRoleId}`);
        
        // Hash the default password
        const defaultPassword = 'Ulacit123';
        const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
        
        // Insert admin user
        console.log('Creating admin user...');
        const insertUserQuery = `
            INSERT INTO Usuario (
                nombre, 
                correo_electronico, 
                fecha_nacimiento, 
                identificacion, 
                rol_id, 
                clave, 
                cambio_clave_requerido,
                activo
            ) VALUES (
                'Administrador', 
                'admin@ulacit.ac.cr', 
                '1990-01-01', 
                'ADMIN001', 
                ?, 
                ?, 
                1,
                1
            )
        `;
        
        await queryAsync(insertUserQuery, [adminRoleId, hashedPassword]);
        
        console.log('Admin user created successfully!');
        console.log('Username: admin@ulacit.ac.cr');
        console.log('Password: Ulacit123');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
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
    
    // Execute the admin user creation
    insertAdminUser()
        .then(() => {
            console.log('Script completed.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Script failed:', err);
            process.exit(1);
        });
});