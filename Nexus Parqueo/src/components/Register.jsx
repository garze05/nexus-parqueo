import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';
import { ROLES } from '../auth/AuthContext';

const Register = () => {
  // State for form data
  const [formData, setFormData] = useState({
    nombre: '',
    correo_electronico: '',
    fecha_nacimiento: '',
    identificacion: '',
    numero_carne: '',
    rol_id: 4, // Default to ESTUDIANTE role
  });

  // State for roles list
  const [roles, setRoles] = useState([]);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const navigate = useNavigate();

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener los roles');
        }
        
        const data = await response.json();
        setRoles(data);
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Error al cargar los roles. Por favor recargue la página.');
      } finally {
        setLoadingRoles(false);
      }
    };
    
    fetchRoles();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      // Parse the response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          // Attempt to parse the response as JSON anyway
          data = JSON.parse(text);
        } catch (e) {
          // If parsing fails, use the text as message
          data = { message: text || 'Error desconocido' };
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }
      
      // Set success and registered user data
      setSuccess(true);
      setRegisteredUser({
        nombre: formData.nombre,
        correo_electronico: formData.correo_electronico,
        rol: getRoleName(formData.rol_id),
        defaultPassword: 'Ulacit123' // This is the default password
      });

      // Reset form
      setFormData({
        nombre: '',
        correo_electronico: '',
        fecha_nacimiento: '',
        identificacion: '',
        numero_carne: '',
        rol_id: 4,
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Error al registrar usuario. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get role name from role ID
  const getRoleName = (rolId) => {
    const role = roles.find(r => r.rol_id == rolId);
    return role ? role.nombre_rol : 'Desconocido';
  };

  // Close success modal
  const handleCloseModal = () => {
    setSuccess(false);
    setRegisteredUser(null);
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div className="flex justify-center mb-4">
          <img src={UlacitLogo} alt="Ulacit Logo" className="h-16" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Registrar Nuevo Usuario
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="correo_electronico" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="correo_electronico"
              name="correo_electronico"
              type="email"
              required
              value={formData.correo_electronico}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Este será el nombre de usuario para iniciar sesión</p>
          </div>

          <div>
            <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">
              Fecha de Nacimiento
            </label>
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              required
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="identificacion" className="block text-sm font-medium text-gray-700">
              Identificación
            </label>
            <input
              id="identificacion"
              name="identificacion"
              type="text"
              required
              value={formData.identificacion}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="numero_carne" className="block text-sm font-medium text-gray-700">
              Número de Carné (opcional)
            </label>
            <input
              id="numero_carne"
              name="numero_carne"
              type="text"
              value={formData.numero_carne}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="rol_id" className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              id="rol_id"
              name="rol_id"
              required
              value={formData.rol_id}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingRoles}
            >
              {loadingRoles ? (
                <option value="">Cargando roles...</option>
              ) : (
                roles.map(role => (
                  <option key={role.rol_id} value={role.rol_id}>
                    {role.nombre_rol}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded shadow-sm transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || loadingRoles}
              className={`px-6 py-2 rounded font-medium shadow-sm ${
                loading || loadingRoles ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Registrando...' : 'Registrar Usuario'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {success && registeredUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Usuario registrado con éxito. Detalles de la cuenta:</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2"><span className="font-semibold">Nombre:</span> {registeredUser.nombre}</p>
                <p className="mb-2"><span className="font-semibold">Correo:</span> {registeredUser.correo_electronico}</p>
                <p className="mb-2"><span className="font-semibold">Rol:</span> {registeredUser.rol}</p>
                <p className="mb-2"><span className="font-semibold">Contraseña temporal:</span> {registeredUser.defaultPassword}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">El usuario deberá cambiar su contraseña en el primer inicio de sesión.</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;