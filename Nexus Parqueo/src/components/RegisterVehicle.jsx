import React, { useState } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';

const RegisterVehicle = () => {
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredVehicle, setRegisteredVehicle] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Formulario de registro de vehículo enviado');

    setLoading(true);
    setError('');

    try {
      console.log('Iniciando intento de registro...');
      console.log('Enviando datos:', { plate, brand, owner });

      const response = await fetch('http://localhost:3001/api/vehicles/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plate, brand, owner })
      });

      console.log('Respuesta recibida:', response);
      console.log('Estado de la respuesta:', response.status);

      if (!response.ok) {
        console.log('Respuesta no válida');
        const errorData = await response.json();
        console.log('Datos de error:', errorData);
        throw new Error(errorData.error || 'Error en el registro del vehículo');
      }

      const data = await response.json();
      console.log('Registro exitoso:', data);
      
      setRegisteredVehicle({
        plate,
        brand,
        owner
      });

      setShowSuccessModal(true);
      
    } catch (err) {
      console.log('Error capturado:', err);
      console.error('Error en el registro:', err);
      if (err.message === 'Failed to fetch') {
        setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté en ejecución.');
      } else {
        setError(err.message || 'Error en el registro. Inténtalo de nuevo.');
      }
    } finally {
      console.log('Intento de registro completado');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <img src={UlacitLogo} alt="Ulacit Logo" className="mb-4" />
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Registrar un Vehículo
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="plate" className="block text-sm font-medium text-gray-700">
              Placa del Vehículo
            </label>
            <input
              id="plate"
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la placa"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
              Marca del Vehículo
            </label>
            <input
              id="brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la marca"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
              Propietario
            </label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el propietario"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Registrando...' : 'Registrar Vehículo'}
          </button>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Vehículo registrado con éxito. Por favor guarde esta información:</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2"><span className="font-semibold">Placa:</span> {registeredVehicle?.plate}</p>
                <p className="mb-2"><span className="font-semibold">Marca:</span> {registeredVehicle?.brand}</p>
                <p><span className="font-semibold">Propietario:</span> {registeredVehicle?.owner}</p>
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

export default RegisterVehicle;