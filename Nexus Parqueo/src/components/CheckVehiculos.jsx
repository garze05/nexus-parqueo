import React, { useState } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';

const CheckVehiculos = () => {
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Consulta de vehículo iniciada');

    setLoading(true);
    setError('');
    setVehicleData(null);
    setSearch(true);

    try {
      console.log('Consultando placa:', plate);
      
      const response = await fetch(`http://localhost:3001/api/vehicles/details/${plate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Respuesta recibida:', response);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Vehículo no encontrado');
          setVehicleData(null);
          return;
        }
        
        const errorData = await response.json();
        console.log('Datos de error:', errorData);
        throw new Error(errorData.error || 'Error en la consulta del vehículo');
      }
      
      const data = await response.json();
      console.log('Consulta exitosa:', data);
      
      setVehicleData(data);
      
    } catch (err) {
      console.log('Error capturado:', err);
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

  // Render parking history as a table
  const renderParkingHistory = () => {
    if (!vehicleData?.parkingHistory || vehicleData.parkingHistory.length === 0) {
      return <p className="text-gray-600">No hay historial de estacionamiento disponible.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parqueo</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleData.parkingHistory.map((entry, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(entry.fecha).toLocaleDateString()}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{entry.parqueo_nombre}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{entry.tipo_movimiento}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{entry.hora}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {entry.motivo_rechazo ? 
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Rechazado
                    </span> : 
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Aceptado
                    </span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render current parking status
  const renderParkingStatus = () => {
    if (!vehicleData?.currentParking) {
      return <p className="text-gray-600">El vehículo no está estacionado actualmente.</p>;
    }

    return (
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="text-md font-semibold text-blue-700 mb-2">Estado Actual de Estacionamiento</h3>
        <div className="space-y-1">
          <p><span className="font-medium">Parqueo:</span> {vehicleData.currentParking.nombre}</p>
          <p><span className="font-medium">Desde:</span> {new Date(vehicleData.currentParking.fecha).toLocaleDateString()} {vehicleData.currentParking.hora_inicio}</p>
          <p><span className="font-medium">Tipo de espacio:</span> {vehicleData.vehicle.usa_espacio_ley7600 ? 'Espacio Ley 7600' : 'Regular'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl p-8">
        <div className="flex items-center justify-between mb-6">
          <img src={UlacitLogo} alt="Ulacit Logo" className="h-12" />
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de Verificación de Vehículos
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="flex space-x-4">
            <div className="flex-grow">
              <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className={`flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? 'Verificando...' : 'Verificar Vehículo'}
              </button>
            </div>
          </div>
        </form>

        {search && !loading && !error && (
          <div className="mt-4">
            {vehicleData ? (
              <div>
                <div className="bg-gray-100 p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-green-600">¡Vehículo Encontrado!</h2>
                    <span className="text-sm font-medium px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      {vehicleData.vehicle.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1"><span className="font-semibold">Placa:</span> {vehicleData.vehicle.numero_placa}</p>
                      <p className="mb-1"><span className="font-semibold">Marca:</span> {vehicleData.vehicle.marca}</p>
                      <p className="mb-1"><span className="font-semibold">Color:</span> {vehicleData.vehicle.color}</p>
                      <p className="mb-1"><span className="font-semibold">Tipo:</span> {vehicleData.vehicle.tipo}</p>
                    </div>
                    <div>
                      <p className="mb-1"><span className="font-semibold">Propietario:</span> {vehicleData.owner.nombre}</p>
                      <p className="mb-1"><span className="font-semibold">Identificación:</span> {vehicleData.owner.identificacion}</p>
                      <p className="mb-1"><span className="font-semibold">Correo:</span> {vehicleData.owner.correo_electronico}</p>
                      <p className="mb-1"><span className="font-semibold">Fecha de registro:</span> {new Date(vehicleData.vehicle.fecha_registro).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                      <button
                        className={`py-2 px-4 text-sm font-medium ${
                          activeTab === 'vehicle'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab('vehicle')}
                      >
                        Estado Actual
                      </button>
                      <button
                        className={`ml-8 py-2 px-4 text-sm font-medium ${
                          activeTab === 'history'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab('history')}
                      >
                        Historial de Uso
                      </button>
                    </nav>
                  </div>
                  <div className="py-4">
                    {activeTab === 'vehicle' ? renderParkingStatus() : renderParkingHistory()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-md">
                <p className="text-red-600 font-medium text-lg">No se encontró ningún vehículo con la placa: {plate}</p>
                <p className="text-gray-600 mt-2">Verifique que la placa esté correcta o registre el vehículo.</p>
                <button
                  onClick={() => window.location.href = '/register-vehicle'}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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