import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UlacitLogo from '/src/assets/ulacit-logo.png';

const VehicleControl = () => {
  const [plate, setPlate] = useState('');
  const [parqueoAsignado, setParqueoAsignado] = useState(null);
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const plateInputRef = useRef(null);

  // Fetch security guard's assigned parking lot
  useEffect(() => {
    const fetchAssignedParking = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/vigilancia/current', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setParqueoAsignado(data);
          
          if (!data) {
            setError('No tiene un parqueo asignado. Por favor seleccione un parqueo primero.');
          }
        } else {
          throw new Error('Error al obtener el parqueo asignado');
        }
      } catch (error) {
        console.error('Error fetching assigned parking:', error);
        setError('Error al cargar el parqueo asignado');
      }
    };
    
    fetchAssignedParking();
  }, []);

  // Reset error and success messages when changing the plate
  useEffect(() => {
    if (plate !== '') {  // Only reset when actively typing, not when clearing
      setError('');
      setSuccess('');
      setVehicleStatus(null);
    }
  }, [plate]);

  // Focus on plate input when component mounts
  useEffect(() => {
    if (plateInputRef.current) {
      plateInputRef.current.focus();
    }
  }, []);

  const checkVehicle = async () => {
    if (!plate.trim()) {
      setError('Por favor ingrese un número de placa');
      return;
    }
    
    if (!parqueoAsignado) {
      setError('No tiene un parqueo asignado. Por favor seleccione un parqueo primero.');
      navigate('/select-parking');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/vehicle-check/${plate}?parkingId=${parqueoAsignado.parqueo_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar el vehículo');
      }
      
      const data = await response.json();
      setVehicleStatus(data);
      
      // Clear plate input after successful check
      setPlate('');
      if (plateInputRef.current) {
        plateInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error checking vehicle:', error);
      setError('Error al verificar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const registerEntry = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/vehicle-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          plate: vehicleStatus.placa || plate,
          parkingId: parqueoAsignado.parqueo_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al registrar el ingreso');
      }
      
      const data = await response.json();
      
      if (data.resultado === 'INGRESO') {
        setSuccess('Ingreso registrado exitosamente');
      } else {
        setError(`Ingreso rechazado: ${data.motivo_rechazo}`);
      }
      
      // Reset state
      setVehicleStatus(null);
      setPlate('');
      if (plateInputRef.current) {
        plateInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error registering entry:', error);
      setError('Error al registrar el ingreso');
    } finally {
      setLoading(false);
    }
  };

  const registerExit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/vehicle-exits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          plate: vehicleStatus.placa || plate,
          parkingId: parqueoAsignado.parqueo_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al registrar la salida');
      }
      
      const data = await response.json();
      
      if (data.resultado === 'SALIDA') {
        setSuccess('Salida registrada exitosamente');
      } else {
        setError('Error al registrar la salida');
      }
      
      // Reset state
      setVehicleStatus(null);
      setPlate('');
      if (plateInputRef.current) {
        plateInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error registering exit:', error);
      setError('Error al registrar la salida');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkVehicle();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img src={UlacitLogo} alt="Ulacit Logo" className="h-10 mr-4" />
            <h1 className="text-xl font-bold text-gray-800">Control de Vehículos</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded shadow-sm transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </nav>
      
      <div className="container mx-auto p-6">
        {/* Officer and parking info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Oficial: {user ? user.name : 'Usuario'}
          </h2>
          {parqueoAsignado ? (
            <p className="text-gray-600">
              Parqueo asignado: <span className="font-medium">{parqueoAsignado.nombre_parqueo}</span>
            </p>
          ) : (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
              <p>No tiene un parqueo asignado.</p>
              <button
                onClick={() => navigate('/select-parking')}
                className="mt-2 px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
              >
                Seleccionar Parqueo
              </button>
            </div>
          )}
        </div>
        
        {/* Plate input and check */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Verificar Placa</h3>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-grow">
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                ref={plateInputRef}
                placeholder="Ingrese número de placa"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || !parqueoAsignado}
              />
            </div>
            <button
              onClick={checkVehicle}
              disabled={loading || !plate.trim() || !parqueoAsignado}
              className={`px-6 py-2 rounded font-medium shadow-sm ${
                loading || !plate.trim() || !parqueoAsignado 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
        </div>
        
        {/* Vehicle status and actions */}
        {vehicleStatus && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Resultado de Verificación</h3>
            
            {/* Vehicle information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Placa:</p>
                  <p className="text-xl font-bold">{vehicleStatus.placa}</p>
                </div>
                <div>
                  <p className="text-gray-600">Propietario:</p>
                  <p className="text-xl font-bold">{vehicleStatus.nombre_propietario || "No registrado"}</p>
                </div>
                {vehicleStatus.tipo_vehiculo && (
                  <div>
                    <p className="text-gray-600">Tipo de Vehículo:</p>
                    <p className="font-medium">{vehicleStatus.tipo_vehiculo}</p>
                  </div>
                )}
                {vehicleStatus.marca && (
                  <div>
                    <p className="text-gray-600">Marca:</p>
                    <p className="font-medium">{vehicleStatus.marca}</p>
                  </div>
                )}
                {vehicleStatus.modelo && (
                  <div>
                    <p className="text-gray-600">Modelo:</p>
                    <p className="font-medium">{vehicleStatus.modelo}</p>
                  </div>
                )}
                {vehicleStatus.color && (
                  <div>
                    <p className="text-gray-600">Color:</p>
                    <p className="font-medium">{vehicleStatus.color}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Traffic light */}
            <div className="flex justify-center mb-6">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                vehicleStatus.estado === 'PERMITIR_INGRESO' 
                  ? 'bg-green-500' 
                  : vehicleStatus.estado === 'REGISTRAR_SALIDA'
                    ? 'bg-blue-500'
                    : 'bg-red-500'
              }`}>
                <span className="text-5xl text-white">
                  {vehicleStatus.estado === 'PERMITIR_INGRESO' 
                    ? '✓' 
                    : vehicleStatus.estado === 'REGISTRAR_SALIDA'
                      ? '↑'
                      : '✕'
                  }
                </span>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold">
                {vehicleStatus.estado === 'PERMITIR_INGRESO' 
                  ? 'PUEDE INGRESAR' 
                  : vehicleStatus.estado === 'REGISTRAR_SALIDA'
                    ? 'REGISTRAR SALIDA'
                    : 'NO PUEDE INGRESAR'
                }
              </h4>
              
              {vehicleStatus.es_primer_ingreso && (
                <p className="text-yellow-600 mt-2 font-medium">
                  ADVERTENCIA: Primer ingreso para registro del vehículo
                </p>
              )}
              
              {vehicleStatus.motivo_rechazo && (
                <p className="text-red-600 mt-2">{vehicleStatus.motivo_rechazo}</p>
              )}
              
              {vehicleStatus.mensaje && (
                <p className="text-blue-600 mt-2">{vehicleStatus.mensaje}</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {vehicleStatus.estado === 'PERMITIR_INGRESO' && (
                <button
                  onClick={registerEntry}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded shadow-md transition-colors"
                >
                  {loading ? 'Registrando...' : 'Registrar Ingreso'}
                </button>
              )}
              
              {vehicleStatus.estado === 'REGISTRAR_SALIDA' && (
                <button
                  onClick={registerExit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-md transition-colors"
                >
                  {loading ? 'Registrando...' : 'Registrar Salida'}
                </button>
              )}
              
              <button
                onClick={() => {
                  setVehicleStatus(null);
                  setPlate('');
                  if (plateInputRef.current) {
                    plateInputRef.current.focus();
                  }
                }}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded shadow-md transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleControl;