import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import DashboardLayout from './DashboardLayout';

const History = () => {
  const [history, setHistory] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  
  const { user } = useAuth();
  
  // Fetch user's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
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
      }
    };
    
    fetchVehicles();
  }, []);
  
  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/history?year=${selectedYear}&month=${selectedMonth}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener el historial');
        }
        
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history:', error);
        setError('Error al cargar el historial de parqueo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [selectedMonth, selectedYear]);
  
  // Filter history by selected vehicle
  const filteredHistory = selectedVehicle === 'all'
    ? history
    : history.filter(record => record.numero_placa === selectedVehicle);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // Display only HH:MM
  };
  
  // Get month name for display
  const getMonthName = (month) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };
  
  return (
    <DashboardLayout headerText={"Historial de Parqueo"}>
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              Historial de Movimientos
            </h2>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Año
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                  Mes
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">
                  Vehículo
                </label>
                <select
                  id="vehicle"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los vehículos</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.vehiculo_id} value={vehicle.numero_placa}>
                      {vehicle.numero_placa} - {vehicle.marca} ({vehicle.color})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* History Table */}
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros para el período seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Fecha</th>
                    <th className="py-3 px-4 text-left">Hora</th>
                    <th className="py-3 px-4 text-left">Placa</th>
                    <th className="py-3 px-4 text-left">Parqueo</th>
                    <th className="py-3 px-4 text-left">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHistory.map((record, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4">{formatDate(record.fecha)}</td>
                      <td className="py-3 px-4">{formatTime(record.hora)}</td>
                      <td className="py-3 px-4 font-medium">{record.numero_placa}</td>
                      <td className="py-3 px-4">{record.nombre_parqueo}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.tipo_movimiento === 'INGRESO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.tipo_movimiento === 'INGRESO' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Summary Section */}
          {filteredHistory.length > 0 && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Resumen del Mes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-gray-500 text-sm">Total de Movimientos</p>
                  <p className="text-2xl font-bold">{filteredHistory.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-gray-500 text-sm">Entradas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredHistory.filter(r => r.tipo_movimiento === 'INGRESO').length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-gray-500 text-sm">Salidas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredHistory.filter(r => r.tipo_movimiento === 'SALIDA').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default History;