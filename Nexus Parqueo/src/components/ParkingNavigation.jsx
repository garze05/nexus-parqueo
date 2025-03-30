import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ParkingNavigation = ({ userRole }) => {
  const location = useLocation();
  
  // Define navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: 'home' },
      { path: '/check-vehicle', label: 'Verificar Vehículo', icon: 'search' },
    ];
    
    // Add new monitoring pages
    if (userRole === 'ADMINISTRADOR' || userRole === 'OFICIAL_SEGURIDAD') {
      baseItems.push(
        { path: '/live-parking', label: 'Monitor en Vivo', icon: 'activity' }
      );
    }
    
    // Admin-only features
    if (userRole === 'ADMINISTRADOR') {
      baseItems.push(
        { path: '/reports', label: 'Reportes', icon: 'file-text' },
        { path: '/users', label: 'Usuarios', icon: 'users' }
      );
    }
    
    // Security guard features
    if (userRole === 'OFICIAL_SEGURIDAD') {
      baseItems.push(
        { path: '/vehicle-entry', label: 'Registro de Vehículos', icon: 'log-in' }
      );
    }
    
    // Student/Admin features
    if (userRole === 'ESTUDIANTE' || userRole === 'ADMINISTRADOR') {
      baseItems.push(
        { path: '/my-vehicles', label: 'Mis Vehículos', icon: 'truck' }
      );
    }
    
    return baseItems;
  };
  
  const navItems = getNavItems();
  
  // Icon component for simplicity
  const Icon = ({ name }) => {
    // This uses Feather icons. In a real application, you'd want to use a proper icon library
    const iconClassName = `w-5 h-5 mr-2`;
    
    return (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {name === 'home' && (
          <>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </>
        )}
        {name === 'search' && (
          <>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </>
        )}
        {name === 'activity' && (
          <>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </>
        )}
        {name === 'file-text' && (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </>
        )}
        {name === 'users' && (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </>
        )}
        {name === 'log-in' && (
          <>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </>
        )}
        {name === 'truck' && (
          <>
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </>
        )}
      </svg>
    );
  };
  
  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex-shrink-0 py-4">
      <div className="px-4 py-2 mb-6">
        <h2 className="text-xl font-bold">Parqueo ULACIT</h2>
      </div>
      
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-1">
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm ${
                  location.pathname === item.path
                    ? 'bg-blue-700 text-white'
                    : 'hover:bg-gray-700'
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto px-4 py-4 border-t border-gray-700">
        <Link
          to="/logout"
          className="flex items-center text-gray-400 hover:text-white text-sm"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar Sesión
        </Link>
      </div>
    </div>
  );
};

export default ParkingNavigation;