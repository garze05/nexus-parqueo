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
    ubicacion: '',
    capacidad_regulares: 0,
    capacidad_motos: 0,
    capacidad_ley7600: 0,
    activo: true
  });
  
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
      
      const data = await response.json();
      setParkingLots(data);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setError('Error al cargar los parqueos');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchParkingLots();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `http://localhost:3001/api/parkings/${currentParking.parqueo_id}`
        : 'http://localhost:3001/api/parkings';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el parqueo');
      }
      
      setSuccess(editMode ? 'Parqueo actualizado exitosamente' : 'Parqueo creado exitosamente');
      resetForm();
      fetchParkingLots();
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
      
      if (!response.ok) {
        throw new Error('Error al eliminar el parqueo');
      }
      
      setSuccess('Parqueo eliminado exitosamente');
      fetchParkingLots();
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      setError('Error al eliminar el parqueo');
    } finally {
      setLoading(false);
    }
  };
  
  // Set up form for editing
  const handleEdit = (parking) => {
    setCurrentParking(parking);
    setFormData({
      nombre: parking.nombre_parqueo,
      ubicacion: parking.ubicacion || '',
      capacidad_regulares: parking.capacidad_regulares,
      capacidad_motos: parking.capacidad_motos,
      capacidad_ley7600: parking.capacidad_ley7600,
      activo: parking.activo === 1
    });
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      nombre: '',
      ubicacion: '',
      capacidad_regulares: 0,
      capacidad_motos: 0,
      capacidad_ley7600: 0,
      activo: true
    });
    setEditMode(false);
    setCurrentParking(null);
  };
  
  return (
    <DashboardLayout headerText="Gestión de Parqueos">
      <div className="container mx-auto p-6">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-[#220236]">
            {editMode ? 'Editar Parqueo' : 'Crear Nuevo Parqueo'}
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                  Nombre del Parqueo
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ubicacion">
                  Ubicación
                </label>
                <input
                  type="text"
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="capacidad_regulares">
                  Espacios Regulares
                </label>
                <input
                  type="number"
                  id="capacidad_regulares"
                  name="capacidad_regulares"
                  required
                  min="0"
                  value={formData.capacidad_regulares}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="capacidad_motos">
                  Espacios para Motos
                </label>
                <input
                  type="number"
                  id="capacidad_motos"
                  name="capacidad_motos"
                  required
                  min="0"
                  value={formData.capacidad_motos}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="capacidad_ley7600">
                  Espacios Ley 7600
                </label>
                <input
                  type="number"
                  id="capacidad_ley7600"
                  name="capacidad_ley7600"
                  required
                  min="0"
                  value={formData.capacidad_ley7600}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700" htmlFor="activo">
                  Parqueo Activo
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#220236] hover:bg-[#3a0c59] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#220236]"
              >
                {loading ? 'Guardando...' : (editMode ? 'Actualizar Parqueo' : 'Crear Parqueo')}
              </button>
            </div>
          </form>
        </div>
        
        {/* List of Parking Lots */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#220236]">Parqueos Existentes</h2>
          
          {loading && (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {!loading && parkingLots.length === 0 && (
            <div className="text-center p-4 text-gray-500">
              No hay parqueos registrados.
            </div>
          )}
          
          {!loading && parkingLots.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Nombre</th>
                    <th className="py-2 px-4 text-left">Ubicación</th>
                    <th className="py-2 px-4 text-center">Espacios Regulares</th>
                    <th className="py-2 px-4 text-center">Espacios Motos</th>
                    <th className="py-2 px-4 text-center">Espacios Ley 7600</th>
                    <th className="py-2 px-4 text-center">Estado</th>
                    <th className="py-2 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parkingLots.map((parking) => (
                    <tr key={parking.parqueo_id}>
                      <td className="py-2 px-4 font-medium">{parking.nombre_parqueo}</td>
                      <td className="py-2 px-4">{parking.ubicacion || 'N/A'}</td>
                      <td className="py-2 px-4 text-center">{parking.capacidad_regulares}</td>
                      <td className="py-2 px-4 text-center">{parking.capacidad_motos}</td>
                      <td className="py-2 px-4 text-center">{parking.capacidad_ley7600}</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${parking.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {parking.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleEdit(parking)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(parking.parqueo_id)}
                          className="text-red-600 hover:text-red-800"
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
      </div>
    </DashboardLayout>
  );
};

export default ParkingManagement;