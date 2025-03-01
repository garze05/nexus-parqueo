import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UlacitLogo from '/src/assets/ulacit-logo.png';

const SelectParking = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParking, setSelectedParking] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch available parking lots
  useEffect(() => {
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
        
        // Also check if the officer has a current assignment
        const assignmentResponse = await fetch('http://localhost:3001/api/vigilancia/current', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          if (assignmentData) {
            setSelectedParking(assignmentData.parqueo_id.toString());
            setSuccess(`Actualmente está asignado al parqueo: ${assignmentData.nombre_parqueo}`);
          }
        }
      } catch (error) {
        console.error('Error fetching parking lots:', error);
        setError('Error al cargar los parqueos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParkingLots();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedParking) {
      setError('Por favor seleccione un parqueo');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/vigilancia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          parqueoId: parseInt(selectedParking)
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al asignar el parqueo');
      }
      
      setSuccess('Asignación a parqueo registrada exitosamente');
      
      // Navigate back to vehicle control after a short delay
      setTimeout(() => {
        navigate('/vehicle-control');
      }, 1500);
    } catch (error) {
      console.error('Error assigning parking lot:', error);
      setError('Error al asignar el parqueo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img src={UlacitLogo} alt="Ulacit Logo" className="h-10 mr-4" />
            <h1 className="text-xl font-bold text-gray-800">Selección de Parqueo</h1>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Oficial: {user ? user.name : 'Usuario'}
          </h2>
          <p className="text-gray-600 mb-4">
            Seleccione el parqueo que estará vigilando durante su turno.
          </p>
          
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
          
          {loading && !parkingLots.length ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="parking" className="block text-sm font-medium text-gray-700">
                  Parqueo
                </label>
                <select
                  id="parking"
                  value={selectedParking}
                  onChange={(e) => setSelectedParking(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccione un parqueo</option>
                  {parkingLots.map((parkingLot) => (
                    <option key={parkingLot.parqueo_id} value={parkingLot.parqueo_id}>
                      {parkingLot.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/vehicle-control')}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded shadow-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedParking}
                  className={`px-6 py-2 rounded font-medium shadow-sm ${
                    loading || !selectedParking 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {loading ? 'Asignando...' : 'Asignar Parqueo'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectParking;