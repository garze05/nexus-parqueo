import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const RegisterVehicle = () => {
  const [formData, setFormData] = useState({
    plateNumber: '',
    platePrefix: '',  // Default empty selection
    brand: '',
    owner: '',
    color: '',
    tipo: 'VEHICULO',
    usa_espacio_ley7600: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Track user vehicle counts
  const [userVehicleCounts, setUserVehicleCounts] = useState({});
  const [isCheckingCount, setIsCheckingCount] = useState(false);

  // Available plate prefixes
  const platePrefixes = ['', 'CC','CD', 'CL', 'D','MOT','VE', 'VH'];

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get the token from localStorage or wherever you store it
        const token = localStorage.getItem('token');
        
        console.log('Fetching users with token:', token);
        
        const response = await fetch('http://localhost:3001/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Error al obtener la lista de usuarios');
        }
        
        const data = await response.json();
        console.log('Users data received:', data);
        setUsers(data);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los usuarios. Por favor, inténtelo de nuevo.');
      }
    };
  
    fetchUsers();
  }, []);

  // Fetch vehicle count for a user
  const checkVehicleCount = async (userId) => {
    if (!userId) return;
    
    setIsCheckingCount(true);
    try {
      const token = localStorage.getItem('token');
      // Create a specific endpoint to check vehicle count or use existing one
      const response = await fetch(`http://localhost:3001/api/vehicles/count/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar cantidad de vehículos');
      }
      
      const data = await response.json();
      setUserVehicleCounts(prev => ({
        ...prev,
        [userId]: data.count
      }));
      
      if (data.count >= 2) {
        setError(`Este usuario ya tiene ${data.count} vehículos registrados (máximo 2).`);
        return false;
      }
      
      setError('');
      return true;
    } catch (err) {
      console.error('Error checking vehicle count:', err);
      setError('Error al verificar la cantidad de vehículos del usuario.');
      return false;
    } finally {
      setIsCheckingCount(false);
    }
  };
  
  // When owner selection changes, check their vehicle count
  useEffect(() => {
    if (formData.owner) {
      checkVehicleCount(formData.owner);
    }
  }, [formData.owner]);

  // Set platePrefix when type or usa_espacio_ley7600 changes
  useEffect(() => {
    if (formData.usa_espacio_ley7600 && formData.platePrefix === '') {
      // Only set D as default if no prefix is selected
      setFormData(prev => ({
        ...prev,
        platePrefix: 'D',
        // Ensure that when Ley 7600 is selected, type cannot be MOTO
        tipo: prev.tipo === 'MOTO' ? 'VEHICULO' : prev.tipo
      }));
    } else if (formData.tipo === 'MOTO' && formData.platePrefix !== 'MOT') {
      setFormData(prev => ({
        ...prev,
        platePrefix: 'MOT'
      }));
    } else if (formData.tipo === 'VEHICULO' && formData.platePrefix === 'MOT') {
      setFormData(prev => ({
        ...prev,
        platePrefix: ''  // Reset to blank if vehicle type is changed to VEHICULO from MOTO
      }));
    }
  }, [formData.usa_espacio_ley7600, formData.tipo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // For the plateNumber field, only allow numbers
    if (name === 'plateNumber') {
      // Replace any non-digit character with an empty string
      const numbersOnly = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        [name]: numbersOnly
      });
    } else if (name === 'usa_espacio_ley7600' && checked) {
      // If checkbox is checked, ensure that type is not MOTO
      // Suggest D as prefix but don't force it
      setFormData({
        ...formData,
        [name]: checked,
        tipo: formData.tipo === 'MOTO' ? 'VEHICULO' : formData.tipo,
        // Only set D as default if no prefix is already selected
        platePrefix: formData.platePrefix === '' ? 'D' : formData.platePrefix
      });
    } else if (name === 'tipo' && value === 'MOTO' && formData.usa_espacio_ley7600) {
      // Prevent setting type to MOTO if usa_espacio_ley7600 is checked
      // Keep the current value and do not update
      return;
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Formulario de registro de vehículo enviado');

    // Combine plateNumber and plateLetter to create the complete plate
    const completePlate = `${formData.platePrefix}${formData.plateNumber}`;

    // Validate form data
    if (!formData.plateNumber.trim() || !formData.brand.trim() || !formData.owner || !formData.color.trim()) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    // Check if selected user already has 2 vehicles
    if (formData.owner && userVehicleCounts[formData.owner] >= 2) {
      setError(`Este usuario ya tiene ${userVehicleCounts[formData.owner]} vehículos registrados (máximo 2).`);
      return;
    }

    // If we haven't checked this user's count yet, do it now
    if (formData.owner && userVehicleCounts[formData.owner] === undefined) {
      const canProceed = await checkVehicleCount(formData.owner);
      if (!canProceed) return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Iniciando intento de registro...');
      console.log('Enviando datos:', { 
        numero_placa: completePlate,
        marca: formData.brand,
        owner: formData.owner,
        color: formData.color,
        tipo: formData.tipo,
        usa_espacio_ley7600: formData.usa_espacio_ley7600
      });

      const response = await fetch('http://localhost:3001/api/vehicles/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          numero_placa: completePlate,
          marca: formData.brand,
          owner: formData.owner,
          color: formData.color,
          tipo: formData.tipo,
          usa_espacio_ley7600: formData.usa_espacio_ley7600
        })
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
      
      setSuccess('Vehículo registrado exitosamente');
      
      // Reset form after successful submission
      setFormData({
        plateNumber: '',
        platePrefix: '',
        brand: '',
        owner: '',
        color: '',
        tipo: 'VEHICULO',
        usa_espacio_ley7600: false
      });
      
      // Optionally redirect after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
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

  // Function to check if prefix option should be disabled
  const isPrefixDisabled = (prefix) => {
    if (formData.tipo === 'MOTO') {
      return prefix !== 'MOT';
    }
    return false;
  };

  return (
    <DashboardLayout headerText={"Registrar Vehículo"}>
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6">
            Registrar un Nuevo Vehículo
          </h2>
          
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">
                    Placa del Vehículo
                  </label>
                  <div className="flex">
                    <select
                      id="platePrefix"
                      name="platePrefix"
                      value={formData.platePrefix}
                      onChange={handleInputChange}
                      disabled={formData.tipo === 'MOTO'}
                      className={`px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formData.tipo === 'MOTO' ? 'bg-gray-100' : ''
                      }`}
                    >
                      {platePrefixes.map(prefix => (
                        <option 
                          key={prefix || 'blank'} 
                          value={prefix}
                          disabled={isPrefixDisabled(prefix)}
                        >
                          {prefix || 'Seleccione prefijo'}
                        </option>
                      ))}
                    </select>
                    <input
                      id="plateNumber"
                      name="plateNumber"
                      type="text"
                      value={formData.plateNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese números de placa"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Seleccione el prefijo a la izquierda e ingrese solo los números de la placa en el campo derecho.
                    {formData.tipo === 'MOTO' && <span className="text-blue-600"> Para motocicletas, el prefijo "MOT" es automático.</span>}
                    {formData.usa_espacio_ley7600 && <span className="text-blue-600"> Para Ley 7600, se recomienda el prefijo "D" pero puede seleccionar otro.</span>}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    Marca del Vehículo
                  </label>
                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese la marca"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <input
                    id="color"
                    name="color"
                    type="text"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej. Rojo, Blanco, Negro"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="VEHICULO">Vehículo</option>
                    <option value="MOTO" disabled={formData.usa_espacio_ley7600}>Motocicleta</option>
                  </select>
                  {formData.usa_espacio_ley7600 && formData.tipo !== 'MOTO' && (
                    <p className="text-xs text-red-500 mt-1">
                      Nota: Para motocicletas no está disponible la selección Ley 7600.
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
                    Propietario
                  </label>
                  <select
                    id="owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione un propietario</option>
                    {users.length > 0 ? (
                      users.map((user) => {
                        const userId = user.usuario_id || user.USUARIO_ID;
                        const vehicleCount = userVehicleCounts[userId];
                        const isMaxed = vehicleCount >= 2;
                        
                        return (
                          <option 
                            key={userId} 
                            value={userId}
                            disabled={isMaxed}
                          >
                            {(user.nombre || user.NOMBRE)} {isMaxed ? '(Máximo de vehículos alcanzado)' : 
                              vehicleCount ? `(${vehicleCount} vehículo${vehicleCount !== 1 ? 's' : ''})` : ''}
                          </option>
                        );
                      })
                    ) : 
                      (<option value="" disabled>Cargando usuarios...</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center mt-2">
                    <input
                      id="usa_espacio_ley7600"
                      name="usa_espacio_ley7600"
                      type="checkbox"
                      checked={formData.usa_espacio_ley7600}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={formData.tipo === 'MOTO'}
                    />
                    <label htmlFor="usa_espacio_ley7600" className={`ml-2 block text-sm ${formData.tipo === 'MOTO' ? 'text-gray-500' : 'text-gray-700'}`}>
                      Utiliza espacio Ley 7600
                    </label>
                    {formData.usa_espacio_ley7600 && (
                      <span className="ml-2 text-sm text-blue-600">
                        (Se recomienda el prefijo "D" para la placa)
                      </span>
                    )}
                    {formData.tipo === 'MOTO' && (
                      <span className="ml-2 text-xs text-red-500">
                        (No disponible para Motocicletas)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded shadow-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded font-medium shadow-sm ${
                    loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {loading ? 'Registrando...' : 'Registrar Vehículo'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Nota: Cada usuario solo puede tener hasta 2 vehículos activos registrados.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterVehicle;