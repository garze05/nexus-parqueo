import React from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import { useAuth } from '/src/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const Dashboard = () => {
  // Retrieve the user from localStorage and authenticate
  const userString = localStorage.getItem('user');
  let user = null;
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  if (userString) {
    user = JSON.parse(userString);
    console.log('Retrieved user:', user);
  } else {
    console.log('No user found in localStorage.');
  }

return (
    // Add a background image to the dashboard

    <div className="p-5 flex flex-col justify-center items-center">
      <LogoutButton />
        <img src={UlacitLogo} alt="Ulacit Logo" />
        <h1 className="mt-10 font-bold text-4xl">Bienvenido a Parqueos ULACIT</h1>
        <p className="mt-5 text-xl font-semibold">
            Sesión iniciada como: {user ? user.username : 'Desconocido'}
        </p>
        {hasRole('admin') && (
        <button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md">
          Registrar Usuario
        </button>
        )}
    </div>
);
};

export default Dashboard;