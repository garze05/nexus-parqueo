import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import { ROLES } from '../auth/roles';

const Register = () => {
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    identification: '',
    studentId: '',
    role: 'user',
  });

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const navigate = useNavigate();

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
      // Call your API to register the user
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token if using JWT
        },
        body: JSON.stringify({
          nombre: formData.name,
          correo_electronico: formData.email,
          fecha_nacimiento: formData.birthDate,
          identificacion: formData.identification,
          numero_carne: formData.studentId || null, // Optional
          rol_id: getRoleId(formData.role),
          // Default password will be set by the server ("Ulacit123")
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar usuario');
      }

      const data = await response.json();
      
      // Set success and registered user data
      setSuccess(true);
      setRegisteredUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        defaultPassword: 'Ulacit123' // This is the default password
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        birthDate: '',
        identification: '',
        studentId: '',
        role: 'user',
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Error al registrar usuario. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map role string to role ID
  const getRoleId = (roleString) => {
    switch (roleString) {
      case ROLES.ADMIN:
        return 1;
      case ROLES.STAFF:
        return 2;
      case ROLES.USER:
        return 3;
      default:
        return 3; // Default to user
    }
  };

  // Close success modal
  const handleCloseModal = () => {
    setSuccess(false);
    setRegisteredUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-6">
      {/* Header */}
      <header className="bg-white shadow-md p-4 mb-6 rounded-lg flex justify-between items-center">
        <div className="flex items-center">
          <img src={UlacitLogo} alt="ULACIT Logo" className="h-10 mr-4" />
          <h1 className="text-xl font-bold text-gray-800">Sistema de Parqueos ULACIT</h1>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Volver al Dashboard
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Registrar Nuevo Usuario
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Este será el nombre de usuario para iniciar sesión</p>
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                Fecha de Nacimiento
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="identification" className="block text-sm font-medium text-gray-700">
                Identificación
              </label>
              <input
                id="identification"
                name="identification"
                type="text"
                required
                value={formData.identification}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Número de Carné (opcional)
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ROLES.USER}>Estudiante</option>
                <option value={ROLES.STAFF}>Oficial de Seguridad</option>
                <option value={ROLES.ADMIN}>Administrador</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? 'Registrando...' : 'Registrar Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {success && registeredUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Usuario registrado con éxito. Detalles de la cuenta:</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2"><span className="font-semibold">Nombre:</span> {registeredUser.name}</p>
                <p className="mb-2"><span className="font-semibold">Correo:</span> {registeredUser.email}</p>
                <p className="mb-2"><span className="font-semibold">Rol:</span> {registeredUser.role}</p>
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