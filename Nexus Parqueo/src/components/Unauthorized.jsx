import React from 'react';
import { Link } from 'react-router-dom';
import UlacitLogo from '/src/assets/ulacit-logo.png';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8 text-center">
        <img src={UlacitLogo} alt="Ulacit Logo" className="h-16 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Acceso No Autorizado
        </h1>
        
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <p>No tiene permisos para acceder a esta página.</p>
        </div>
        
        <p className="text-gray-700 mb-6">
          Su rol actual no tiene acceso a la página solicitada. Si cree que esto es un error, contacte al administrador del sistema.
        </p>
        
        <div className="flex justify-center gap-4">
          <Link 
            to="/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;