import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import UlacitLogoBlanco from '/src/assets/ulacit-logo-blanco.png';
import LogoutButton from './LogoutButton';
import BackToDashboardButton from './BackToDashboardButton';
import UlacitBG from '/src/assets/ulacit-bg.png';

import { useAuth } from '../auth/AuthContext';

const DashboardLayout = ({ children, headerText }) => {
const { user } = useAuth();
const location = useLocation();

  // Mostrar el botón solo si la ruta actual NO es "/dashboard"
  const showBackButton = location.pathname !== '/dashboard';
  console.log(showBackButton);

    return (
        <div className="grid min-h-[100dvh] grid-rows-[auto_1fr_auto] bg-gray-100" style={{ backgroundImage: `url(${UlacitBG})`}}>
        <nav className="px-20 bg-[#220236] shadow-md py-10">
            <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
                <img src={UlacitLogoBlanco} alt="Ulacit Logo" className="h-10 mr-4" />
                <div>
                    <h1 className="text-xl font-bold text-white">{headerText}</h1>
                    <h6 className="text-sm text-gray-300">{user ? user.role : 'Desconocido'}</h6>
                </div>
            </div>
            {!showBackButton && <LogoutButton />}
            {showBackButton && <BackToDashboardButton />}
            </div>
        </nav>


            <main className='flex items-center'>{children}</main>
            
            <footer className="flex items-center bg-black text-white p-4 py-10 mt-6">
                <div className="container mx-auto text-center">
                <p>© {new Date().getFullYear()} ULACIT - Sistema de Parqueos</p>
                </div>
            </footer>
      </div>
    );
};

export default DashboardLayout