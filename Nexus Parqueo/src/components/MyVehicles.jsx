import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import DashboardLayout from './DashboardLayout';

const MyVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    marca: '',
    color: '',
    numero_placa: '',
    tipo: 'VEHICULO',
    usa_espacio_ley7600: false
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch user's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/vehicles', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener los vehículos');
        }
        
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError('Error al cargar los vehículos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.marca.trim() || !formData.color.trim() || !formData.numero_placa.trim() || !formData.tipo) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Check if user has reached the limit of 2 vehicles
    if (vehicles.filter(v => v.activo).length >= 2) {
      setError('No se pueden registrar más de 2 vehículos por usuario');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Improved error handling and request
      const response = await fetch('http://localhost:3001/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      // Check content type of response
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          // Parse error as JSON if that's what we received
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
        } else {
          // Handle non-JSON error response
          const errorText = await response.text();
          console.error("Server returned non-JSON response:", errorText);
          throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }
      }
      
      // Process successful response
      const data = await response.json();
      console.log("Vehicle registered successfully:", data);
      
      // Reset form
      setFormData({
        marca: '',
        color: '',
        numero_placa: '',
        tipo: 'VEHICULO',
        usa_espacio_ley7600: false
      });
      
      setSuccess('Vehículo registrado exitosamente');
      setShowAddForm(false);
      
      // Refresh the vehicle list
      const vehiclesResponse = await fetch('http://localhost:3001/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData);
      }
    } catch (error) {
      console.error('Error registering vehicle:', error);
      setError(error.message || 'Error al registrar el vehículo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout headerText={"Mis Vehículos"}>
      
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Vehículos Registrados
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded font-medium shadow-sm ${
                vehicles.filter(v => v.activo).length >= 2
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={vehicles.filter(v => v.activo).length >= 2}
            >
              {showAddForm ? 'Cancelar' : 'Agregar Vehículo'}
            </button>
          </div>
          
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
          
          {/* Add Vehicle Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Vehículo</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
                      Marca
                    </label>
                    <input
                      id="marca"
                      name="marca"
                      type="text"
                      value={formData.marca}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej. Toyota, Nissan, Honda"
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
                    <label htmlFor="numero_placa" className="block text-sm font-medium text-gray-700">
                      Número de Placa
                    </label>
                    <input
                      id="numero_placa"
                      name="numero_placa"
                      type="text"
                      value={formData.numero_placa}
                      onChange={(e) => handleInputChange({
                        target: {
                          name: e.target.name,
                          value: e.target.value.toUpperCase(),
                          type: e.target.type,
                          checked: e.target.checked
                        }
                      })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej. ABC123"
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
                      <option value="MOTO">Motocicleta</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="usa_espacio_ley7600"
                    name="usa_espacio_ley7600"
                    type="checkbox"
                    checked={formData.usa_espacio_ley7600}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={formData.tipo === 'MOTO'}
                  />
                  <label htmlFor="usa_espacio_ley7600" className="ml-2 block text-sm text-gray-700">
                    Utiliza espacio Ley 7600
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
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
          )}
          
          {/* Vehicles List */}
          {loading && !vehicles.length ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tiene vehículos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Placa</th>
                    <th className="py-3 px-4 text-left">Marca</th>
                    <th className="py-3 px-4 text-left">Color</th>
                    <th className="py-3 px-4 text-left">Tipo</th>
                    <th className="py-3 px-4 text-left">Espacio Ley 7600</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.vehiculo_id}>
                      <td className="py-3 px-4 font-medium">{vehicle.numero_placa}</td>
                      <td className="py-3 px-4">{vehicle.marca}</td>
                      <td className="py-3 px-4">{vehicle.color}</td>
                      <td className="py-3 px-4">{vehicle.tipo === 'VEHICULO' ? 'Vehículo' : 'Motocicleta'}</td>
                      <td className="py-3 px-4">
                        {vehicle.usa_espacio_ley7600 ? 'Sí' : 'No'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vehicle.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {vehicles.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Nota: Puede tener un máximo de 2 vehículos activos registrados.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyVehicles;