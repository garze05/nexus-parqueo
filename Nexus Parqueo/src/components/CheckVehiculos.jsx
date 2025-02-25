import React, { use, useState } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';

const CheckVehiculos =() => {
    const [plate, setPlate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [vehicleFound, setVehicleFound] = useState(null);
    const [search, setSearch] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Formulario de registro de vehículo enviado');

        setLoading(true);
        setError('');
        setVehicleFound(null);
        setSearch(true);


        try {
            console.log('Iniciando consulta de vehículo...');
            console.log('Consultando placa:', plate);
      
            const response = await fetch(`http://localhost:3001/api/vehicles/check/${plate}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
      
            console.log('Respuesta recibida:', response);
            console.log('Estado de la respuesta:', response.status);
      
            if (!response.ok) {
              if (response.status === 404) {
                console.log('Vehículo no encontrado');
                setVehicleFound(null);
                return;
              }
              
              console.log('Respuesta no válida');
              const errorData = await response.json();
              console.log('Datos de error:', errorData);
              throw new Error(errorData.error || 'Error en la consulta del vehículo');
            }
      
            const data = await response.json();
            console.log('Consulta exitosa:', data);
            
            setVehicleFound(data.vehicle);
            
          } catch (err) {
            console.log('Error capturado:', err);
            console.error('Error en la consulta:', err);
            if (err.message === 'Failed to fetch') {
              setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté en ejecución.');
            } else {
              setError(err.message || 'Error en la consulta. Inténtalo de nuevo.');
            }
          } finally {
            console.log('Consulta completada');
            setLoading(false);
          }
        };
      
        return (
          <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
            <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
              <img src={UlacitLogo} alt="Ulacit Logo" className="mb-4" />
              <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Verificar un Vehículo
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
                    placeholder="Ingrese la placa para verificar"
                  />
                </div>
      
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Verificando...' : 'Verificar Vehículo'}
                </button>
              </form>
      
              {search && !loading && !error && (
                <div className="mt-6 p-4 rounded-md border">
                  {vehicleFound ? (
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-green-600">¡Vehículo Encontrado!</h2>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="mb-2"><span className="font-semibold">Placa:</span> {vehicleFound.plate}</p>
                        <p className="mb-2"><span className="font-semibold">Marca:</span> {vehicleFound.brand}</p>
                        <p><span className="font-semibold">Propietario:</span> {vehicleFound.owner}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-red-600 font-medium">No se encontró ningún vehículo con la placa: {plate}</p>
                      <p className="text-gray-600 mt-2">Verifique que la placa esté correcta o registre el vehículo.</p>
                      <button
                        onClick={() => window.location.href = '/register-vehicle'}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ir a Registrar Vehículo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      };
      
      export default CheckVehiculos;