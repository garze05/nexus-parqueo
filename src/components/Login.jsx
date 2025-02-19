import React, { useState } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    setLoading(true);
    setError('');

    try {
      console.log('Starting login attempt...');
      console.log('Sending credentials:', { username });

      // Send request to backend API on port 3001
      const response = await fetch('http://localhost:3001/api/auth/login', {
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
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Parsed response data:', data);

      if (data.success) {
        console.log('Login successful, preparing to redirect');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Local storage set, redirecting...');
        window.location.href = '/dashboard';
      } else {
        console.log('Login unsuccessful:', data);
        throw new Error('Login unsuccessful');
      }
    } catch (err) {
      console.log('Caught error:', err);
      console.error('Login error:', err);
      if (err.message === 'Failed to fetch') {
        setError('Could not connect to the server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      console.log('Login attempt completed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})`}}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <img src={UlacitLogo} alt="Ulacit Logo" className="mb-4"></img>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Inicia Sesión en Parqueos ULACIT
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Iniciando Sesión...' : 'Entrar'}
          </button>
          
          <div className="text-center mt-4 text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-500">
              Regístrate aquí
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;