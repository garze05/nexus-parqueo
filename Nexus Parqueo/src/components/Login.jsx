import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';
import { ROLES, PERMISSIONS } from '../auth/roles';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      // Check if user is a security officer and redirect accordingly
      if (user.role === ROLES.SECURITY) {
        navigate('/select-parking');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const result = await login(username, password);
      
      console.log('Login result:', result); // Debug log
      
      if (result.success) {
        // Check if password needs to be changed
        if (result.user.passwordChangeRequired === true) {
          console.log('Redirecting to change password', result.user); // Debug log
          
          navigate('/force-change-password', { 
            state: { 
              fromLogin: true,
              username: result.user.username 
            } 
          });
        } else {
          // Check if user has SECURITY role and redirect accordingly
          if (result.user.role === ROLES.SECURITY) {
            navigate('/select-parking');
          } else {
            // Navigate to original destination or dashboard
            navigate('/dashboard');
          }
        }
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})`}}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div className="flex justify-center mb-4">
          <img src={UlacitLogo} alt="Ulacit Logo" className="h-16" />
        </div>
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
              Correo Electrónico
            </label>
            <input
              id="username"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su correo electrónico"
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
        </form>
      </div>
    </div>
  );
};

export default Login;