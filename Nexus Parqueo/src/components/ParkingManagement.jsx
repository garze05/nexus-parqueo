import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const ParkingManagement = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // States for the form
  const [editMode, setEditMode] = useState(false);
  const [currentParking, setCurrentParking] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad_regulares: 0,
    capacidad_motos: 0,
    capacidad_ley7600: 0,
    activo: true
  });
  
  // States for occupancy view
  const [selectedParkingId, setSelectedParkingId] = useState(null);
  const [showOccupancy, setShowOccupancy] = useState(false);
  const [occupancyData, setOccupancyData] = useState(null);
  const [loadingOccupancy, setLoadingOccupancy] = useState(false);
  const [occupancyError, setOccupancyError] = useState('');
  
  // Predefined capacity options
  const capacityOptions = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  const motorcycleOptions = [0, 5, 10, 15, 20, 25, 30];
  const ley7600Options = [0, 1, 2, 3, 4, 5, 6, 8, 10];
  
  const navigate = useNavigate();
  
  // Fetch all parking lots
  const fetchParkingLots = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/parkings', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener los parqueos');
      }
      
      // First get response as text to handle potential JSON parse errors
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse the response text as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing API response:', responseText);
        throw new Error('Error en el formato de respuesta del servidor');
      }
      
      setParkingLots(data);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setError(error.message || 'Error al cargar los parqueos');
      
      // If API fails, load mock data for development purposes
      const mockData = [
        {
          parqueo_id: 1,
          nombre: 'Parqueo 1',
          capacidad_regulares: 10,
          capacidad_motos: 6,
          capacidad_ley7600: 2,
          activo: 1
        },
        {
          parqueo_id: 2,
          nombre: 'Parqueo 2',
          capacidad_regulares: 20,
          capacidad_motos: 10,
          capacidad_ley7600: 2,
          activo: 1
        },
        {
          parqueo_id: 3,
          nombre: 'Parqueo 3',
          capacidad_regulares: 10,
          capacidad_motos: 12,
          capacidad_ley7600: 4,
          activo: 1
        }
      ];
      setParkingLots(mockData);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch occupancy data for a specific parking lot
  const fetchOccupancyData = async (parkingId) => {
    if (!parkingId) return;
    
    setLoadingOccupancy(true);
    setOccupancyError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/occupancy/${parkingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener la ocupación');
      }
      
      // First get response as text to handle potential JSON parse errors
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse the response text as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing occupancy response:', responseText);
        throw new Error('Error en el formato de respuesta de ocupación');
      }
      
      setOccupancyData(data);
    } catch (error) {
      console.error('Error fetching occupancy:', error);
      setOccupancyError(error.message || 'Error al cargar los datos de ocupación');
      
      // Mock data for occupancy
      const mockOccupancyData = {
        parqueo_id: parkingId,
        capacidad_regulares: parkingLots.find(p => p.parqueo_id === parkingId)?.capacidad_regulares || 0,
        capacidad_motos: parkingLots.find(p => p.parqueo_id === parkingId)?.capacidad_motos || 0,
        capacidad_ley7600: parkingLots.find(p => p.parqueo_id === parkingId)?.capacidad_ley7600 || 0,
        espacios_regulares_ocupados: Math.floor(Math.random() * (parkingLots.find(p => p.parqueo_id === parkingId)?.capacidad_regulares || 10)),
        espacios_motos_ocupados: Math.floor(Math.random() * (parkingLots.find(p => p.parqueo_id === parkingId)?.capacidad_motos || 5)),
        espacios_ley7600_ocupados: Math.floor(Math.random() * (parkingLots.find(p => p.parqueo_id === parkingId)?.capacidad_ley7600 || 2)),
        fecha_actualizacion: new Date().toISOString()
      };
      setOccupancyData(mockOccupancyData);
    } finally {
      setLoadingOccupancy(false);
    }
  };
  
  useEffect(() => {
    fetchParkingLots();
  }, []);
  
  // Fetch occupancy data when selectedParkingId changes
  useEffect(() => {
    if (selectedParkingId && showOccupancy) {
      fetchOccupancyData(selectedParkingId);
      
      // Set up polling for real-time updates
      const intervalId = setInterval(() => {
        fetchOccupancyData(selectedParkingId);
      }, 60000); // Update every minute
      
      return () => clearInterval(intervalId);
    }
  }, [selectedParkingId, showOccupancy]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'number' || name === 'capacidad_regulares' || name === 'capacidad_motos' || name === 'capacidad_ley7600') {
      // Handle dropdown "custom" option
      if (value === 'custom') {
        setFormData(prev => ({
          ...prev,
          [name]: prev[name] // Keep current value when switching to custom
        }));
        return;
      }
      
      const numValue = parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : Math.max(0, numValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del parqueo es obligatorio');
      return false;
    }
    
    if (formData.capacidad_regulares < 0 || 
        formData.capacidad_motos < 0 || 
        formData.capacidad_ley7600 < 0) {
      setError('Las capacidades no pueden ser valores negativos');
      return false;
    }
    
    // Check if there is at least one type of parking space
    if (formData.capacidad_regulares === 0 && 
        formData.capacidad_motos === 0 && 
        formData.capacidad_ley7600 === 0) {
      setError('El parqueo debe tener al menos un tipo de espacio disponible');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `http://localhost:3001/api/parkings/${currentParking.parqueo_id}`
        : 'http://localhost:3001/api/parkings';
      
      const method = editMode ? 'PUT' : 'POST';
      
      // Log the data being sent to help with debugging
      console.log(`Sending ${method} request to ${url}:`, formData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      // Get response as text first to debug any JSON parsing issues
      const responseText = await response.text();
      let responseData;
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing response:', responseText);
          throw new Error('Error en el formato de respuesta del servidor');
        }
      }
      
      if (!response.ok) {
        throw new Error(responseData?.error || 'Error al guardar el parqueo');
      }
      
      setSuccess(editMode ? 'Parqueo actualizado exitosamente' : 'Parqueo creado exitosamente');
      resetForm();
      fetchParkingLots();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error saving parking lot:', error);
      setError(error.message || 'Error al guardar el parqueo');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a parking lot
  const handleDelete = async (parkingId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este parqueo?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/parkings/${parkingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      // Get the response as text first to handle potential JSON parse errors
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Error al eliminar el parqueo';
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          console.error('Invalid error response:', responseText);
        }
        throw new Error(errorMessage);
      }
      
      setSuccess('Parqueo eliminado exitosamente');
      fetchParkingLots();
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      setError(error.message || 'Error al eliminar el parqueo');
    } finally {
      setLoading(false);
    }
  };
  
  // Set up form for editing
  const handleEdit = (parking) => {
    setCurrentParking(parking);
    setFormData({
      nombre: parking.nombre,
      capacidad_regulares: parking.capacidad_regulares,
      capacidad_motos: parking.capacidad_motos,
      capacidad_ley7600: parking.capacidad_ley7600,
      activo: parking.activo === 1 || parking.activo === true
    });
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      nombre: '',
      capacidad_regulares: 0,
      capacidad_motos: 0,
      capacidad_ley7600: 0,
      activo: true
    });
    setEditMode(false);
    setCurrentParking(null);
  };
  
  // View occupancy
  const handleViewOccupancy = (parkingId) => {
    setSelectedParkingId(parkingId);
    setShowOccupancy(true);
    setOccupancyData(null); // Reset previous data
  };
  
  // Calculate percentage for occupancy bars
  const calculatePercentage = (occupied, total) => {
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
  };
  
  // Calculate overall capacity for a parking lot
  const calculateTotalCapacity = (parking) => {
    return parking.capacidad_regulares + parking.capacidad_motos + parking.capacidad_ley7600;
  };
  
  return (
    <DashboardLayout headerText="Gestión de Parqueos">
      <div className="container mx-auto p-6">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-[#220236]">
            {editMode ? 'Editar Parqueo' : 'Crear Nuevo Parqueo'}
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
                  <label className="block text-sm font-medium text-gray-700" htmlFor="nombre">
                    Nombre del Parqueo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del parqueo"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="capacidad_regulares">
                    Espacios Regulares <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="capacidad_regulares"
                    name="capacidad_regulares"
                    value={capacityOptions.includes(formData.capacidad_regulares) ? formData.capacidad_regulares : 'custom'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {capacityOptions.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="custom">Otro valor...</option>
                  </select>
                  {!capacityOptions.includes(formData.capacidad_regulares) && (
                    <input
                      type="number"
                      min="0"
                      name="capacidad_regulares"
                      value={formData.capacidad_regulares}
                      onChange={handleChange}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese valor personalizado"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="capacidad_motos">
                    Espacios para Motos
                  </label>
                  <select
                    id="capacidad_motos"
                    name="capacidad_motos"
                    value={motorcycleOptions.includes(formData.capacidad_motos) ? formData.capacidad_motos : 'custom'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {motorcycleOptions.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="custom">Otro valor...</option>
                  </select>
                  {!motorcycleOptions.includes(formData.capacidad_motos) && (
                    <input
                      type="number"
                      min="0"
                      name="capacidad_motos"
                      value={formData.capacidad_motos}
                      onChange={handleChange}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese valor personalizado"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="capacidad_ley7600">
                    Espacios Ley 7600
                  </label>
                  <select
                    id="capacidad_ley7600"
                    name="capacidad_ley7600"
                    value={ley7600Options.includes(formData.capacidad_ley7600) ? formData.capacidad_ley7600 : 'custom'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ley7600Options.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="custom">Otro valor...</option>
                  </select>
                  {!ley7600Options.includes(formData.capacidad_ley7600) && (
                    <input
                      type="number"
                      min="0"
                      name="capacidad_ley7600"
                      value={formData.capacidad_ley7600}
                      onChange={handleChange}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese valor personalizado"
                    />
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="activo"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="ml-2 text-sm font-medium text-gray-700">
                      Parqueo Activo
                    </label>
                    <span className="ml-2 text-xs text-gray-500">
                      (Un parqueo inactivo no aparecerá disponible para los usuarios)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded shadow-sm transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded font-medium shadow-sm ${
                    loading 
                      ? 'bg-[#3a0c59] cursor-not-allowed' 
                      : 'bg-[#220236] hover:bg-[#3a0c59]'
                  } text-white`}
                >
                  {loading ? 'Guardando...' : (editMode ? 'Actualizar Parqueo' : 'Crear Parqueo')}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Nota: Asegúrese de que el número de espacios cumple con las normativas de accesibilidad.</p>
          </div>
        </div>
        
        {/* List of Parking Lots */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-[#220236]">Parqueos Existentes</h2>
          
          {loading && !parkingLots.length && (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {!loading && parkingLots.length === 0 && (
            <div className="text-center p-4 text-gray-500">
              No hay parqueos registrados.
            </div>
          )}
          
          {parkingLots.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Nombre</th>
                    <th className="py-2 px-4 text-center">Espacios Regulares</th>
                    <th className="py-2 px-4 text-center">Espacios Motos</th>
                    <th className="py-2 px-4 text-center">Espacios Ley 7600</th>
                    <th className="py-2 px-4 text-center">Capacidad Total</th>
                    <th className="py-2 px-4 text-center">Estado</th>
                    <th className="py-2 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parkingLots.map((parking) => (
                    <tr key={parking.parqueo_id} className={!parking.activo ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 font-medium">
                        {parking.nombre}
                      </td>
                      <td className="py-2 px-4 text-center">{parking.capacidad_regulares}</td>
                      <td className="py-2 px-4 text-center">{parking.capacidad_motos}</td>
                      <td className="py-2 px-4 text-center">{parking.capacidad_ley7600}</td>
                      <td className="py-2 px-4 text-center">{calculateTotalCapacity(parking)}</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${parking.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {parking.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleViewOccupancy(parking.parqueo_id)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Ver ocupación"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEdit(parking)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Editar parqueo"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(parking.parqueo_id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar parqueo"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Occupancy View */}
        {showOccupancy && selectedParkingId && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#220236]">
                Ocupación del Parqueo
              </h2>
              <button
                onClick={() => setShowOccupancy(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
            </div>
            
            {loadingOccupancy && !occupancyData && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {occupancyError && !occupancyData && (
              <div className="text-sm text-red-600">
                {occupancyError}
              </div>
            )}
            
            {occupancyData && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {parkingLots.find(p => p.parqueo_id === selectedParkingId)?.nombre}
                </h3>
                
                {/* Regular */}
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Espacios Regulares</span>
                    <span className="text-sm font-medium">
                      {occupancyData.espacios_regulares_ocupados}/{occupancyData.capacidad_regulares} 
                      ({calculatePercentage(occupancyData.espacios_regulares_ocupados, occupancyData.capacidad_regulares)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${calculatePercentage(occupancyData.espacios_regulares_ocupados, occupancyData.capacidad_regulares)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Moto */}
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Espacios para Motos</span>
                    <span className="text-sm font-medium">
                      {occupancyData.espacios_motos_ocupados}/{occupancyData.capacidad_motos}
                      ({calculatePercentage(occupancyData.espacios_motos_ocupados, occupancyData.capacidad_motos)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${calculatePercentage(occupancyData.espacios_motos_ocupados, occupancyData.capacidad_motos)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Ley 7600 */}
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Espacios Ley 7600</span>
                    <span className="text-sm font-medium">
                      {occupancyData.espacios_ley7600_ocupados}/{occupancyData.capacidad_ley7600}
                      ({calculatePercentage(occupancyData.espacios_ley7600_ocupados, occupancyData.capacidad_ley7600)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${calculatePercentage(occupancyData.espacios_ley7600_ocupados, occupancyData.capacidad_ley7600)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-right mt-2">
                  Actualizado: {new Date(occupancyData.fecha_actualizacion).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParkingManagement;