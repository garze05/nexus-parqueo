import React from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';

const Dashboard = () => {
  // Retrieve the user from localStorage on another page
  const userString = localStorage.getItem('user');
  let user = null;

  if (userString) {
    user = JSON.parse(userString);
    console.log('Retrieved user:', user);
  } else {
    console.log('No user found in localStorage.');
  }

return (
    // Add a background image to the dashboard

    <div className="p-5 flex flex-col justify-center items-center">
        <img src={UlacitLogo} alt="Ulacit Logo" />
        <h1 className="mt-10 font-bold text-4xl">Bienvenido a Parqueos ULACIT</h1>
        <p className="mt-5 text-xl font-semibold">
            Sesión iniciada como: {user ? user.username : 'Desconocido'}
        </p>
    </div>
);
};

export default Dashboard;