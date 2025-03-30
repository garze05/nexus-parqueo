const express = require('express');
const cors = require('cors');
const sql = require('msnodesqlv8');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());
app.use(cookieParser());

// Database connection string
const connectionString = process.env.DB_CONNECTION_STRING || 
                        "server=localhost;Database=ParqueoUlacit;Trusted_Connection=Yes;Driver={SQL Server}";
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'UlacitUniversidadPrivadaNumeroUnoEnCentroamerica';
const JWT_EXPIRES_IN = '2h';

// Helper function for SQL queries
const queryAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        sql.query(connectionString, query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Check if user has required role
const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userRole = req.user.role;
        
        if (Array.isArray(roles)) {
            if (!roles.includes(userRole)) {
                return res.status(403).json({ error: 'User does not have required role' });
            }
        } else {
            if (userRole !== roles) {
                return res.status(403).json({ error: 'User does not have required role' });
            }
        }
        
        next();
    };
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    try {
        const query = `
            SELECT u.usuario_id, u.nombre, u.correo_electronico, u.identificacion, 
                u.rol_id, r.nombre_rol, u.clave, u.cambio_clave_requerido
            FROM Usuario u
            JOIN Rol r ON u.rol_id = r.rol_id
            WHERE u.correo_electronico = ? AND u.activo = 1
        `;
        
        const users = await queryAsync(query, [username]);
        
        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.clave);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
        }

        console.log('Login route - User data:', {
            usuario_id: user.usuario_id,
            cambio_clave_requerido: user.cambio_clave_requerido,
            cambio_clave_requerido_type: typeof user.cambio_clave_requerido
        });

        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.usuario_id, 
                username: user.correo_electronico,
                name: user.nombre,
                role: user.nombre_rol,
                rolId: user.rol_id,
                passwordChangeRequired: user.cambio_clave_requerido === 1
            }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Send token as a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            success: true,
            user: {
                id: user.usuario_id,
                name: user.nombre,
                username: user.correo_electronico,
                role: user.nombre_rol,
                rolId: user.rol_id,
                passwordChangeRequired: Boolean(user.cambio_clave_requerido)
            },
            token: token
        });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Change password endpoint
app.post('/api/auth/force-change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
    }

    try {
        // Get user's current password
        const userQuery = "SELECT clave FROM Usuario WHERE usuario_id = ?";
        const users = await queryAsync(userQuery, [userId]);
        
        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = users[0];
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.clave);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        
        // Update password and reset the change password flag
        const updateQuery = `
            UPDATE Usuario 
            SET clave = ?, cambio_clave_requerido = 0 
            WHERE usuario_id = ?
        `;
        
        await queryAsync(updateQuery, [hashedPassword, userId]);
        
        res.json({ message: 'Contraseña actualizada con éxito' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});


//Register users (ADMIN)
app.post('/api/users', authenticateToken, hasRole('ADMINISTRADOR'), async (req, res) => {
    const { nombre, correo_electronico, fecha_nacimiento, identificacion, numero_carne, rol_id } = req.body;

    if (!nombre || !correo_electronico || !fecha_nacimiento || !identificacion || !rol_id) {
        return res.status(400).json({ error: 'Todos los campos requeridos deben ser completados' });
    }

    try {
        // Check if email already exists
        const checkQuery = "SELECT COUNT(*) AS count FROM Usuario WHERE correo_electronico = ?";
        const checkResult = await queryAsync(checkQuery, [correo_electronico]);
        
        if (checkResult[0].count > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Default password hashed
        const defaultPassword = 'Ulacit123';
        const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

        // Prepare the insert query with optional numero_carne
        let insertQuery, queryParams;
        if (numero_carne) {
            insertQuery = `
                INSERT INTO Usuario (
                    nombre, correo_electronico, fecha_nacimiento, identificacion, 
                    numero_carne, rol_id, clave, cambio_clave_requerido
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
            queryParams = [
                nombre, correo_electronico, fecha_nacimiento, 
                identificacion, numero_carne, rol_id, hashedPassword
            ];
        } else {
            insertQuery = `
                INSERT INTO Usuario (
                    nombre, correo_electronico, fecha_nacimiento, identificacion, numero_carne,
                    rol_id, clave, cambio_clave_requerido
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
            queryParams = [
                nombre, correo_electronico, fecha_nacimiento, 
                identificacion, identificacion, rol_id, hashedPassword
            ];
        }
        
        await queryAsync(insertQuery, queryParams);

        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, hasRole('ADMINISTRADOR',), async (req, res) => {
    try {
        const query = `
            SELECT u.usuario_id, u.nombre, u.correo_electronico, u.identificacion, 
                u.numero_carne, u.fecha_nacimiento, r.nombre_rol, u.activo
            FROM Usuario u
            JOIN Rol r ON u.rol_id = r.rol_id
            ORDER BY u.nombre
        `;
        
        const users = await queryAsync(query);
        
        res.json(users);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    
    // Users can only access their own information unless they're admins
    if (req.user.role !== 'ADMINISTRADOR' && req.user.id != userId) {
        return res.status(403).json({ error: 'No autorizado para acceder a esta información' });
    }

    try {
        const query = `
            SELECT u.usuario_id, u.nombre, u.correo_electronico, u.identificacion, 
                u.numero_carne, u.fecha_nacimiento, r.nombre_rol, u.activo
            FROM Usuario u
            JOIN Rol r ON u.rol_id = r.rol_id
            WHERE u.usuario_id = ?
        `;
        
        const users = await queryAsync(query, [userId]);
        
        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(users[0]);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get vehicle count for a specific user (admin only)
app.get('/api/vehicles/count/:userId', authenticateToken, hasRole('ADMINISTRADOR'), async (req, res) => {
    const userId = req.params.userId;
    
    if (!userId) {
        return res.status(400).json({ error: 'ID de usuario requerido' });
    }
    
    try {
        const query = "SELECT COUNT(*) AS count FROM Vehiculo WHERE usuario_id = ? AND activo = 1";
        const result = await queryAsync(query, [userId]);
        
        res.json({ count: result[0].count });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// Check if vehicle can enter parking, and if vehicle exists in DB as well as if second attempt
app.get('/api/vehicle-check/:plate', async (req, res) => {
    const plate = req.params.plate;
    const parkingId = req.query.parkingId;
    
    if (!plate || !parkingId) {
        return res.status(400).json({ 
            estado: 'NO_PERMITIR_INGRESO',
            motivo_rechazo: 'Placa de vehículo y ID de parqueo requeridos' 
        });
    }
    
    try {
        // Check if vehicle exists and is active
        const vehicleQuery = `
            SELECT v.numero_placa as placa, v.marca, v.tipo, v.activo,
                   CASE WHEN u.nombre IS NULL OR u.nombre = '' THEN 'No registrado' ELSE u.nombre END as nombre_propietario
            FROM [ParqueoUlacit].[dbo].[Vehiculo] v
            LEFT JOIN [ParqueoUlacit].[dbo].[Usuario] u ON v.usuario_id = u.usuario_id
            WHERE v.numero_placa = ?`;
        const vehicles = await queryAsync(vehicleQuery, [plate]);
        
        // Check parking lot capacity
        const capacityQuery = `
            SELECT p.capacidad_regulares, p.capacidad_motos, p.capacidad_ley7600,
                   ISNULL(o.espacios_regulares_ocupados, 0) as espacios_regulares_ocupados,
                   ISNULL(o.espacios_motos_ocupados, 0) as espacios_motos_ocupados,
                   ISNULL(o.espacios_ley7600_ocupados, 0) as espacios_ley7600_ocupados
            FROM [ParqueoUlacit].[dbo].[Parqueo] p
            LEFT JOIN [ParqueoUlacit].[dbo].[OcupacionParqueo] o ON p.parqueo_id = o.parqueo_id
            WHERE p.parqueo_id = ? AND p.activo = 1`;
        
        const capacityResult = await queryAsync(capacityQuery, [parkingId]);
        
        if (capacityResult.length === 0) {
            return res.json({
                placa: plate,
                estado: 'NO_PERMITIR_INGRESO',
                motivo_rechazo: 'Parqueo no encontrado o inactivo',
                nombre_propietario: 'No registrado'
            });
        }
        
        // Check if vehicle is currently in a parking lot
        const locationQuery = `
            SELECT b.*, p.nombre as nombre_parqueo
            FROM [ParqueoUlacit].[dbo].[Bitacora] b
            JOIN [ParqueoUlacit].[dbo].[Parqueo] p ON b.parqueo_id = p.parqueo_id
            WHERE b.numero_placa = ?
            AND b.tipo_movimiento = 'INGRESO'
            AND NOT EXISTS (
                SELECT 1 
                FROM [ParqueoUlacit].[dbo].[Bitacora] exit_record
                WHERE exit_record.numero_placa = b.numero_placa
                AND exit_record.tipo_movimiento = 'SALIDA'
                AND exit_record.fecha >= b.fecha
                AND exit_record.hora > b.hora
            )
            ORDER BY b.fecha DESC, b.hora DESC`;
        
        const locationResult = await queryAsync(locationQuery, [plate]);
        
        if (locationResult.length > 0) {
            // Vehicle is in a parking lot
            if (locationResult[0].parqueo_id.toString() === parkingId.toString()) {
                // Vehicle is in the current parking lot - should register exit
                return res.json({
                    placa: plate,
                    estado: 'REGISTRAR_SALIDA',
                    parqueo_actual: locationResult[0].nombre_parqueo,
                    nombre_propietario: vehicles.length > 0 ? vehicles[0].nombre_propietario : 'No registrado'
                });
            } else {
                // Vehicle is in a different parking lot - cannot enter here
                return res.json({
                    placa: plate,
                    estado: 'NO_PERMITIR_INGRESO',
                    motivo_rechazo: `Vehículo se encuentra actualmente en ${locationResult[0].nombre_parqueo}`,
                    nombre_propietario: vehicles.length > 0 ? vehicles[0].nombre_propietario : 'No registrado'
                });
            }
        }
        
        //Check if parking lot is full (based on vehicle type)
        const capacity = capacityResult[0];
        const isRegularFull = capacity.espacios_regulares_ocupados >= capacity.capacidad_regulares;
        
        if (isRegularFull) {
            return res.json({
                placa: plate,
                estado: 'NO_PERMITIR_INGRESO',
                motivo_rechazo: 'Parqueo lleno - No hay espacios disponibles',
                nombre_propietario: vehicles.length > 0 ? vehicles[0].nombre_propietario : 'No registrado'
            });
        }
        
        // Check business rules for unregistered/inactive vehicles
        if (vehicles.length === 0 || !vehicles[0].activo) {
            // Check if this is first-time entry for registration
            const previousEntryQuery = `
                SELECT COUNT(*) as entry_count
                FROM [ParqueoUlacit].[dbo].[Bitacora]
                WHERE numero_placa = ? AND tipo_movimiento = 'INGRESO'`;
            
            const previousEntryResult = await queryAsync(previousEntryQuery, [plate]);
            const entryCount = previousEntryResult[0].entry_count;
            
            if (entryCount === 0) {
                // First-time entry allowed for registration
                return res.json({
                    placa: plate,
                    estado: 'PERMITIR_INGRESO',
                    mensaje: 'Primer ingreso permitido para registro del vehículo',
                    es_primer_ingreso: true,
                    nombre_propietario: 'No registrado'
                });
            } else {
                // Already entered once, but not registered properly
                const reason = vehicles.length === 0 
                    ? 'Vehículo no registrado en el sistema' 
                    : 'Vehículo inactivo en el sistema';
                    
                return res.json({
                    placa: plate,
                    estado: 'NO_PERMITIR_INGRESO',
                    motivo_rechazo: `${reason}. Ya se permitió un ingreso previo para registro.`,
                    nombre_propietario: vehicles.length > 0 ? vehicles[0].nombre_propietario : 'No registrado'
                });
            }
        }
        
        // If we get here, vehicle exists, is active, and parking has space
        return res.json({
            placa: vehicles[0].placa,
            estado: 'PERMITIR_INGRESO',
            tipo: vehicles[0].tipo,
            marca: vehicles[0].marca,
            nombre_propietario: vehicles[0].nombre_propietario
        });
        
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ 
            estado: 'NO_PERMITIR_INGRESO', 
            motivo_rechazo: 'Error interno del servidor',
            nombre_propietario: 'No registrado'
        });
    }
});



//Check detallado de vehiculos
app.get('/api/vehicles/details/:plate', async (req, res) => {
    const { plate } = req.params;
    
    try {
      console.log('Searching for vehicle with plate:', plate);
      
      // Check if vehicle exists and is active
      const vehicleQuery = `
        SELECT 
          vehiculo_id, marca, color, numero_placa, tipo, 
          usuario_id, usa_espacio_ley7600, activo, fecha_registro
        FROM [ParqueoUlacit].[dbo].[Vehiculo] 
        WHERE numero_placa = ?
      `;
      
      const vehicles = await queryAsync(vehicleQuery, [plate]);
      console.log('Vehicle query results:', vehicles);
      
      if (!vehicles || vehicles.length === 0) {
        console.log('No vehicle found with plate:', plate);
        return res.status(404).json({ error: 'Vehículo no encontrado' });
      }
      
      const vehicle = vehicles[0];
      
      // Get owner information
      const ownerQuery = `
        SELECT 
          usuario_id, nombre, correo_electronico, 
          identificacion, numero_carne, rol_id, activo
        FROM [ParqueoUlacit].[dbo].[Usuario] 
        WHERE usuario_id = ?
      `;
      
      const owners = await queryAsync(ownerQuery, [vehicle.usuario_id]);
      
      if (!owners || owners.length === 0) {
        console.log('Owner not found for vehicle:', vehicle.vehiculo_id);
        return res.status(404).json({ error: 'Propietario no encontrado' });
      }
      
      const owner = owners[0];
      
      // Check if vehicle is currently parked
      const parkingQuery = `
        SELECT 
          v.vigilancia_id, v.parqueo_id, v.fecha, v.hora_inicio, v.hora_fin,
          p.nombre, p.capacidad_regulares, p.capacidad_motos, p.capacidad_ley7600
        FROM [ParqueoUlacit].[dbo].[Vigilancia] v
        JOIN [ParqueoUlacit].[dbo].[Parqueo] p ON v.parqueo_id = p.parqueo_id
        WHERE v.activo = 1
        AND EXISTS (
          SELECT 1 FROM [ParqueoUlacit].[dbo].[Bitacora] b 
          WHERE b.numero_placa = ? 
          AND b.tipo_movimiento = 'INGRESO' 
          AND b.parqueo_id = v.parqueo_id
        )
      `;
      
      const currentParking = await queryAsync(parkingQuery, [plate]);
      
      // Get parking history - using TOP instead of LIMIT for SQL Server
      const historyQuery = `
        SELECT TOP 50
          b.registro_id, b.parqueo_id, 
          b.tipo_movimiento, b.fecha, b.hora,
          b.motivo_rechazo, b.oficial_id, 
          p.nombre AS parqueo_nombre
        FROM [ParqueoUlacit].[dbo].[Bitacora] b
        JOIN [ParqueoUlacit].[dbo].[Parqueo] p ON b.parqueo_id = p.parqueo_id
        WHERE b.numero_placa = ?
        ORDER BY b.fecha DESC, b.hora DESC
      `;
      
      const parkingHistory = await queryAsync(historyQuery, [plate]);
      
      // Return all data
      res.json({
        vehicle,
        owner,
        currentParking: currentParking.length > 0 ? currentParking[0] : null,
        parkingHistory
      });
      
    } catch (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Error en la consulta de la base de datos: ' + error.message });
    }
});

// Get all roles
app.get('/api/roles', authenticateToken, async (req, res) => {
    try {
        const query = "SELECT rol_id, nombre_rol, descripcion FROM Rol";
        const roles = await queryAsync(query);
        
        res.json(roles);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Vehicle registration *Admin only*
app.post('/api/vehicles/register', authenticateToken, hasRole('ADMINISTRADOR'), async (req, res) => {
    try {
        // Log the incoming request for debugging
        console.log('Admin vehicle registration request:', req.body);
        
        // Extract fields from request body
        const { numero_placa, marca, color, tipo, usa_espacio_ley7600, owner } = req.body;
        
        // Validate required fields
        if (!numero_placa || !marca || !color || !tipo || !owner) {
            return res.status(400).json({ error: 'Todos los campos requeridos deben ser completados' });
        }

        // Check if plate already exists
        const checkPlateQuery = "SELECT COUNT(*) AS count FROM Vehiculo WHERE numero_placa = ?";
        const plateResult = await queryAsync(checkPlateQuery, [numero_placa]);
        
        if (plateResult[0].count > 0) {
            return res.status(400).json({ error: 'El número de placa ya está registrado' });
        }

        // Check vehicle count limit (max 2 per user)
        const checkVehicleCountQuery = "SELECT COUNT(*) AS count FROM Vehiculo WHERE usuario_id = ? AND activo = 1";
        const vehicleCountResult = await queryAsync(checkVehicleCountQuery, [owner]);
        
        if (vehicleCountResult[0].count >= 2) {
            return res.status(400).json({ error: 'No se pueden registrar más de 2 vehículos por usuario' });
        }

        // Insert vehicle
        const insertQuery = `
            INSERT INTO Vehiculo (
                marca, color, numero_placa, tipo, usuario_id, usa_espacio_ley7600
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await queryAsync(insertQuery, [
            marca, color, numero_placa, tipo, owner, usa_espacio_ley7600 ? 1 : 0
        ]);

        res.status(201).json({ message: 'Vehículo registrado exitosamente' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
    }
});

// Get user vehicles
app.get('/api/vehicles', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT vehiculo_id, marca, color, numero_placa, tipo, 
                   usa_espacio_ley7600, activo, fecha_registro
            FROM Vehiculo
            WHERE usuario_id = ?
            ORDER BY fecha_registro DESC
        `;
        
        const vehicles = await queryAsync(query, [userId]);
        
        res.json(vehicles);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get all parking lots
app.get('/api/parkings', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT parqueo_id, nombre, capacidad_regulares, 
                   capacidad_motos, capacidad_ley7600, activo
            FROM Parqueo
            WHERE activo = 1
        `;
        
        const parkings = await queryAsync(query);
        
        res.json(parkings);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get parking lot occupation (for admin and security staff)
app.get('/api/parkings/occupation', authenticateToken, hasRole(['ADMINISTRADOR', 'OFICIAL_SEGURIDAD']), async (req, res) => {
    try {
        const query = `SELECT * FROM Vista_OcupacionActual`;
        const occupation = await queryAsync(query);
        
        res.json(occupation);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get specific parking lot occupation
app.get('/api/parkings/:id/occupation', authenticateToken, hasRole(['ADMINISTRADOR', 'OFICIAL_SEGURIDAD']), async (req, res) => {
    const parkingId = req.params.id;
    
    try {
        const query = `
            SELECT * FROM Vista_OcupacionActual
            WHERE parqueo_id = ?
        `;
        
        const occupation = await queryAsync(query, [parkingId]);
        
        if (!occupation || occupation.length === 0) {
            return res.status(404).json({ error: 'Parqueo no encontrado' });
        }
        
        res.json(occupation[0]);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// vehicle-exits API endpoint
app.post('/api/vehicle-exits', authenticateToken, hasRole('OFICIAL_SEGURIDAD'), async (req, res) => {
    const { plate, parkingId } = req.body;
    const officerId = req.user.id;
    
    if (!plate || !parkingId) {
        return res.status(400).json({ error: 'Se requiere la placa y el ID del parqueo' });
    }

    try {
        // Call stored procedure to register vehicle exit
        const query = `
            DECLARE @resultado NVARCHAR(20), @motivo NVARCHAR(255);
            EXEC RegistrarSalidaVehiculo
                @p_numero_placa = ?, 
                @p_parqueo_id = ?, 
                @p_oficial_id = ?;
        `;
        
        const result = await queryAsync(query, [plate, parkingId, officerId]);
        
        if (!result || result.length === 0) {
            return res.status(500).json({ error: 'Error al registrar la salida del vehículo' });
        }
        
        // Check if exit was rejected
        if (result[0].resultado === 'RECHAZO') {
            return res.status(400).json({ 
                resultado: 'RECHAZO', 
                motivo_rechazo: result[0].motivo_rechazo || 'Salida rechazada por el sistema' 
            });
        }
        
        res.json(result[0]);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// vehicle-entries API endpoint
app.post('/api/vehicle-entries', authenticateToken, hasRole('OFICIAL_SEGURIDAD'), async (req, res) => {
    const { plate, parkingId } = req.body;
    const officerId = req.user.id;
    
    if (!plate || !parkingId) {
        return res.status(400).json({ error: 'Se requiere la placa y el ID del parqueo' });
    }

    try {
        // Call stored procedure to register vehicle entry
        const query = `
            DECLARE @resultado NVARCHAR(20), @motivo NVARCHAR(255);
            EXEC RegistrarIngresoVehiculo 
                @p_numero_placa = ?, 
                @p_parqueo_id = ?, 
                @p_oficial_id = ?;
        `;
        
        const result = await queryAsync(query, [plate, parkingId, officerId]);
        
        if (!result || result.length === 0) {
            return res.status(500).json({ error: 'Error al registrar el ingreso del vehículo' });
        }
        
        // Check if entry was rejected
        if (result[0].resultado === 'RECHAZO') {
            return res.status(400).json({ 
                resultado: 'RECHAZO', 
                motivo_rechazo: result[0].motivo_rechazo || 'Ingreso rechazado por el sistema' 
            });
        }
        
        res.json(result[0]);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Register security guard's parking lot assignment
app.post('/api/vigilancia', authenticateToken, hasRole('OFICIAL_SEGURIDAD'), async (req, res) => {
    const { parqueoId } = req.body;
    const userId = req.user.id;
    
    if (!parqueoId) {
        return res.status(400).json({ error: 'Se requiere el ID del parqueo' });
    }

    try {
        // Check if there's an active assignment
        const checkQuery = `
            SELECT vigilancia_id FROM Vigilancia
            WHERE usuario_id = ? AND fecha = CONVERT(DATE, GETDATE()) AND hora_fin IS NULL
        `;
        
        const activeAssignment = await queryAsync(checkQuery, [userId]);
        
        if (activeAssignment && activeAssignment.length > 0) {
            // Close the current assignment
            const updateQuery = `
                UPDATE Vigilancia
                SET hora_fin = CONVERT(TIME, GETDATE())
                WHERE vigilancia_id = ?
            `;
            
            await queryAsync(updateQuery, [activeAssignment[0].vigilancia_id]);
        }

        // Create new assignment
        const insertQuery = `
            INSERT INTO Vigilancia (usuario_id, parqueo_id, fecha, hora_inicio)
            VALUES (?, ?, CONVERT(DATE, GETDATE()), CONVERT(TIME, GETDATE()))
        `;
        
        await queryAsync(insertQuery, [userId, parqueoId]);
        
        res.status(201).json({ message: 'Asignación a parqueo registrada exitosamente' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get current security guard's parking lot assignment
app.get('/api/vigilancia/current', authenticateToken, hasRole('OFICIAL_SEGURIDAD'), async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT v.vigilancia_id, v.parqueo_id, p.nombre AS nombre_parqueo,
                   v.fecha, v.hora_inicio
            FROM Vigilancia v
            JOIN Parqueo p ON v.parqueo_id = p.parqueo_id
            WHERE v.usuario_id = ? AND v.fecha = CONVERT(DATE, GETDATE()) AND v.hora_fin IS NULL
        `;
        
        const assignment = await queryAsync(query, [userId]);
        
        if (!assignment || assignment.length === 0) {
            return res.json(null);
        }
        
        res.json(assignment[0]);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get user parking history (by month)
app.get('/api/history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { year, month } = req.query;
    
    if (!year || !month) {
        return res.status(400).json({ error: 'Se requiere el año y mes' });
    }

    try {
        const query = `
            SELECT b.fecha, b.hora, b.tipo_movimiento, 
                   v.numero_placa, p.nombre AS nombre_parqueo
            FROM Bitacora b
            JOIN Vehiculo v ON b.vehiculo_id = v.vehiculo_id
            JOIN Parqueo p ON b.parqueo_id = p.parqueo_id
            WHERE v.usuario_id = ? 
              AND YEAR(b.fecha) = ? 
              AND MONTH(b.fecha) = ?
            ORDER BY b.fecha DESC, b.hora DESC
        `;
        
        const history = await queryAsync(query, [userId, year, month]);
        
        res.json(history);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get failed entry attempts (admin only)
app.get('/api/failed-entries', authenticateToken, hasRole('ADMINISTRADOR'), async (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requiere fechas de inicio y fin' });
    }

    try {
        const query = `
            SELECT * FROM Vista_IntentosFallidos
            WHERE fecha BETWEEN ? AND ?
            ORDER BY fecha DESC, hora DESC
        `;
        
        const failedEntries = await queryAsync(query, [startDate, endDate]);
        
        res.json(failedEntries);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// Add these endpoints to your Express app in server.js

// Get parking logs with filtering
app.get('/api/parking-logs', authenticateToken, async (req, res) => {
    const { startDate, endDate, parkingId, plate } = req.query;
    
    // Validate required parameters
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }
    
    try {
        // Base query
        let query = `
            SELECT b.registro_id, b.parqueo_id, b.tipo_movimiento, 
                  b.fecha, b.hora, b.motivo_rechazo, b.oficial_id,
                  b.numero_placa, p.nombre AS nombre_parqueo,
                  CASE 
                      WHEN u.nombre IS NULL THEN 'No registrado' 
                      ELSE u.nombre 
                  END AS nombre_propietario
            FROM Bitacora b
            JOIN Parqueo p ON b.parqueo_id = p.parqueo_id
            LEFT JOIN Vehiculo v ON b.numero_placa = v.numero_placa
            LEFT JOIN Usuario u ON v.usuario_id = u.usuario_id
            WHERE b.fecha BETWEEN ? AND ?
        `;
        
        // Parameters array
        let params = [startDate, endDate];
        
        // Add parking filter if provided
        if (parkingId) {
            query += " AND b.parqueo_id = ?";
            params.push(parkingId);
        }
        
        // Add plate filter if provided
        if (plate) {
            query += " AND b.numero_placa = ?";
            params.push(plate);
        }
        
        // Add order by
        query += " ORDER BY b.fecha DESC, b.hora DESC";
        
        // Execute query
        const logs = await queryAsync(query, params);
        
        res.json(logs);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get parking statistics
app.get('/api/parking-stats', authenticateToken, async (req, res) => {
    const { parkingId } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Get today's entry/exit counts
        const query = `
            SELECT 
                COUNT(CASE WHEN tipo_movimiento = 'INGRESO' THEN 1 END) AS total_ingresos,
                COUNT(CASE WHEN tipo_movimiento = 'SALIDA' THEN 1 END) AS total_salidas,
                COUNT(CASE WHEN tipo_movimiento = 'INGRESO' AND motivo_rechazo IS NOT NULL THEN 1 END) AS ingresos_rechazados,
                COUNT(DISTINCT numero_placa) AS vehiculos_unicos
            FROM Bitacora
            WHERE fecha = ?
            ${parkingId ? 'AND parqueo_id = ?' : ''}
        `;
        
        const params = parkingId ? [today, parkingId] : [today];
        const stats = await queryAsync(query, params);
        
        res.json({
            stats: stats[0],
            date: today
        });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get most frequent users (for analytics)
app.get('/api/frequent-users', authenticateToken, hasRole('ADMINISTRADOR'), async (req, res) => {
    const { startDate, endDate, parkingId, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }
    
    try {
        let query = `
            SELECT TOP ${parseInt(limit)}
                b.numero_placa,
                COUNT(*) AS total_visitas,
                MAX(b.fecha) AS ultima_visita,
                CASE 
                    WHEN u.nombre IS NULL THEN 'No registrado' 
                    ELSE u.nombre 
                END AS nombre_propietario
            FROM Bitacora b
            LEFT JOIN Vehiculo v ON b.numero_placa = v.numero_placa
            LEFT JOIN Usuario u ON v.usuario_id = u.usuario_id
            WHERE b.tipo_movimiento = 'INGRESO'
              AND b.fecha BETWEEN ? AND ?
        `;
        
        let params = [startDate, endDate];
        
        if (parkingId) {
            query += " AND b.parqueo_id = ?";
            params.push(parkingId);
        }
        
        query += `
            GROUP BY b.numero_placa, 
            CASE 
                WHEN u.nombre IS NULL THEN 'No registrado' 
                ELSE u.nombre 
            END
            ORDER BY total_visitas DESC
        `;
        
        const frequentUsers = await queryAsync(query, params);
        
        res.json(frequentUsers);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});