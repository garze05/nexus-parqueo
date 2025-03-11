import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import LogoutButton from './LogoutButton';
import { ROLES, PERMISSIONS } from '../auth/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const { user, hasRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [parkingOccupation, setParkingOccupation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch parking occupation if user has permission
  useEffect(() => {
    const fetchParkingOccupation = async () => {
      if (hasPermission(PERMISSIONS.VIEW_OCCUPATION)) {
        setLoading(true);
        setError('');
        
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3001/api/parkings/occupation', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Error al obtener los datos de ocupación');
          }
          
          const data = await response.json();
          setParkingOccupation(data);
        } catch (error) {
          console.error('Error fetching parking occupation:', error);
          setError('Error al cargar los datos de ocupación');
          
          // If API fails, load mock data for development purposes
          const mockData = [
            {
              parqueo_id: 1,
              nombre_parqueo: 'Parqueo Principal',
              capacidad_regulares: 100,
              capacidad_motos: 20,
              capacidad_ley7600: 5,
              espacios_regulares_ocupados: 75,
              espacios_motos_ocupados: 12,
              espacios_ley7600_ocupados: 2,
              espacios_regulares_disponibles: 25,
              espacios_motos_disponibles: 8,
              espacios_ley7600_disponibles: 3
            },
            {
              parqueo_id: 2,
              nombre_parqueo: 'Parqueo Secundario',
              capacidad_regulares: 50,
              capacidad_motos: 10,
              capacidad_ley7600: 3,
              espacios_regulares_ocupados: 20,
              espacios_motos_ocupados: 5,
              espacios_ley7600_ocupados: 1,
              espacios_regulares_disponibles: 30,
              espacios_motos_disponibles: 5,
              espacios_ley7600_disponibles: 2
            },
            {
              parqueo_id: 3,
              nombre_parqueo: 'Parqueo Torre',
              capacidad_regulares: 70,
              capacidad_motos: 15,
              capacidad_ley7600: 4,
              espacios_regulares_ocupados: 65,
              espacios_motos_ocupados: 10,
              espacios_ley7600_ocupados: 3,
              espacios_regulares_disponibles: 5,
              espacios_motos_disponibles: 5,
              espacios_ley7600_disponibles: 1
            }
          ];
          setParkingOccupation(mockData);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchParkingOccupation();
  }, [hasPermission]);
  
  return (
    <DashboardLayout headerText={"Sistema de Parqueos ULACIT"}>
      <div className="container mx-auto p-6">
        
        {/* Quick Actions Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-4xl font-bold mb-4 text-[#220236]">
            Bienvenido, {user ? user.name.split(" ")[0] : 'Usuario'}
          </h2>
          <h3 className="text-xl font-semibold mb-4 text-[#220236]">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hasRole(ROLES.ADMIN) && (
              <>
                <button 
                  onClick={() => navigate('/register')}
                  className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">👥</span>
                  <span className="font-medium text-center">Registrar Usuario</span>
                </button>
                <button 
                  onClick={() => navigate('/users')}
                  className="p-4 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">👤</span>
                  <span className="font-medium text-center">Administrar Usuarios</span>
                </button>
                <button 
                  onClick={() => navigate('/parking-lots')}
                  className="p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">🅿️</span>
                  <span className="font-medium text-center">Gestionar Parqueos</span>
                </button>
                <button 
                  onClick={() => navigate('/reports/failed-entries')}
                  className="p-4 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">🚫</span>
                  <span className="font-medium text-center">Intentos Fallidos</span>
                </button>
                <button 
                  onClick={() => navigate('/vehicles/register')}
                  className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">🚗</span>
                  <span className="font-medium text-center">Registrar Vehiculos</span>
                </button>
              </>
            )}
            
            {hasRole(ROLES.SECURITY) && (
              <>
                <button 
                  onClick={() => navigate('/vehicle-control')}
                  className="p-4 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">🚗</span>
                  <span className="font-medium text-center">Control de Vehículos</span>
                </button>
                <button 
                  onClick={() => navigate('/select-parking')}
                  className="p-4 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">🔄</span>
                  <span className="font-medium text-center">Seleccionar Parqueo</span>
                </button>
              </>
            )}
            
            {(hasRole([ROLES.STUDENT, ROLES.STAFF, ROLES.ADMIN, ROLES.SECURITY])) && (
              <>
                <button 
                  onClick={() => navigate('/vehicle-check')}
                  className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">🚗</span>
                  <span className="font-medium text-center">Revisar Vehículo</span>
                </button>
                <button 
                  onClick={() => navigate('/history')}
                  className="p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors flex flex-col items-center justify-center h-32"
                >
                  <span className="text-2xl mb-2">📅</span>
                  <span className="font-medium text-center">Historial de Uso</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Parking Occupation Section */}
        {hasPermission(PERMISSIONS.VIEW_OCCUPATION) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Ocupación de Parqueos</h3>
            
            {loading && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {!loading && parkingOccupation.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left">Parqueo</th>
                      <th className="py-2 px-4 text-center">Regulares</th>
                      <th className="py-2 px-4 text-center">Motos</th>
                      <th className="py-2 px-4 text-center">Ley 7600</th>
                      <th className="py-2 px-4 text-center">% Ocupación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parkingOccupation.map((parking) => {
                      const totalSpaces = parking.capacidad_regulares + parking.capacidad_motos + parking.capacidad_ley7600;
                      const totalOccupied = parking.espacios_regulares_ocupados + parking.espacios_motos_ocupados + parking.espacios_ley7600_ocupados;
                      const occupationPercentage = (totalOccupied / totalSpaces * 100).toFixed(1);
                      
                      return (
                        <tr key={parking.parqueo_id}>
                          <td className="py-2 px-4 font-medium">{parking.nombre_parqueo}</td>
                          <td className="py-2 px-4 text-center">
                            {parking.espacios_regulares_ocupados} / {parking.capacidad_regulares}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {parking.espacios_motos_ocupados} / {parking.capacidad_motos}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {parking.espacios_ley7600_ocupados} / {parking.capacidad_ley7600}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  occupationPercentage < 70 ? 'bg-green-600' : 
                                  occupationPercentage < 90 ? 'bg-yellow-500' : 'bg-red-600'
                                }`}
                                style={{ width: `${occupationPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{occupationPercentage}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {!loading && parkingOccupation.length === 0 && (
              <div className="text-center p-4 text-gray-500">
                No hay datos de ocupación disponibles.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;