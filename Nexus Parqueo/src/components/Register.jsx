import React, { useState } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Registration form submitted');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting registration attempt...');
      console.log('Sending credentials:', { username });

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Raw response received:', response);
      console.log('Response status:', response.status);

      if (!response.ok) {
        console.log('Response not ok');
        const errorData = await response.json();
        console.log('Error data:', errorData);
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
        setRegisteredUser({
            username: username,
            password: password
        });
        setShowSuccessModal(true);

      
    } catch (err) {
      console.log('Caught error:', err);
      console.error('Registration error:', err);
      if (err.message === 'Failed to fetch') {
        setError('Could not connect to the server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      console.log('Registration attempt completed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})`}}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <img src={UlacitLogo} alt="Ulacit Logo" className="mb-4" />
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Regístrate en Parqueos ULACIT
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su nombre de usuario"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su contraseña"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirme su contraseña"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol de Usuario
            </label>
            <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                <option value="staff">Guarda de Seguridad</option>
                </select>
            </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
      </div>

      {showSuccessModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">Usuario registrado con éxito. Por favor guarde esta información:</p>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="mb-2"><span className="font-semibold">Usuario:</span> {registeredUser?.username}</p>
          <p><span className="font-semibold">Contraseña:</span> {registeredUser?.password}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowSuccessModal(false);
            window.location.href = '/dashboard';
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Continuar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Register;