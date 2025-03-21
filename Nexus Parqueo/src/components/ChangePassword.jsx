import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('Ulacit123');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Ambas contraseñas son requeridas');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
    if (!passwordRegex.test(newPassword)) {
      setError('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(result.error || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('Error al cambiar la contraseña. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

// If not required to change password, redirect to dashboard
useEffect(() => {
    console.log('Current user in Change Password:', user); // Debug log
    
    // Check for multiple conditions to ensure redirection
    if (user && (user.passwordChangeRequired === false || user.passwordChangeRequired === undefined)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div className="flex justify-center mb-4">
          <img src={UlacitLogo} alt="Ulacit Logo" className="h-16" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Cambiar Contraseña
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6">
          <p className="font-medium">Cambio de Contraseña Obligatorio</p>
          <p className="text-sm">Debe cambiar su contraseña temporal antes de continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su contraseña actual"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su nueva contraseña"
            />
            <p className="text-xs text-gray-500 mt-1">
              La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y caracteres especiales.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirme su nueva contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Cambiando Contraseña...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;