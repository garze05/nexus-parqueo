import React, { createContext, useContext, useState, useEffect } from 'react';

// Define role constants
export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  SECURITY: 'OFICIAL_SEGURIDAD',
  STAFF: 'PERSONAL_ADMINISTRATIVO',
  STUDENT: 'ESTUDIANTE'
};

export const PERMISSIONS = {
  CREATE_USER: 'create_user',
  DELETE_USER: 'delete_user',
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_PROFILE: 'edit_profile',
  VIEW_PUBLIC: 'view_public',
  VIEW_OCCUPATION: 'view_occupation',
  MANAGE_VEHICLES: 'manage_vehicles',
  MANAGE_PARKINGS: 'manage_parkings',
  VEHICLE_ENTRY_EXIT: 'vehicle_entry_exit',
  ACCESS_REPORTS: 'access_reports',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_LOGS: 'view_logs',
  CHECK_VEHICLES: 'check_vehicles',
  VIEW_OWN: 'view_own'
};

// Role-permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [PERMISSIONS.CREATE_USER,
      PERMISSIONS.DELETE_USER,
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.VIEW_PUBLIC,
      PERMISSIONS.VIEW_OCCUPATION,
      PERMISSIONS.MANAGE_VEHICLES,
      PERMISSIONS.MANAGE_PARKINGS,
      PERMISSIONS.VEHICLE_ENTRY_EXIT,
      PERMISSIONS.ACCESS_REPORTS,
      PERMISSIONS.SYSTEM_SETTINGS,
      PERMISSIONS.VIEW_LOGS,
      PERMISSIONS.CHECK_VEHICLES,
      PERMISSIONS.VIEW_OWN],
      
  [ROLES.STUDENT]: [
      PERMISSIONS.VIEW_DASHBOARD, 
      PERMISSIONS.EDIT_PROFILE, 
      PERMISSIONS.VIEW_PUBLIC,
      PERMISSIONS.VIEW_OCCUPATION,
      PERMISSIONS.CHECK_VEHICLES,
      PERMISSIONS.VIEW_OWN
  ],
  [ROLES.STAFF]: [
      PERMISSIONS.VIEW_DASHBOARD, 
      PERMISSIONS.EDIT_PROFILE, 
      PERMISSIONS.VIEW_PUBLIC,
      PERMISSIONS.VIEW_OCCUPATION,
      PERMISSIONS.VEHICLE_ENTRY_EXIT,
      PERMISSIONS.ACCESS_REPORTS,
      PERMISSIONS.CHECK_VEHICLES,
      PERMISSIONS.VIEW_OWN
  ],
  [ROLES.SECURITY]:[
      PERMISSIONS.VIEW_OCCUPATION,
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_PUBLIC,
      PERMISSIONS.VEHICLE_ENTRY_EXIT,
      PERMISSIONS.CHECK_VEHICLES,
      PERMISSIONS.VIEW_OWN
  ]



};

const AuthContext = createContext(null);

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a stored token or user data in localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ username, password })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error de inicio de sesión');
      }
  
      const data = await response.json();
      
      if (data.success) {
        // Update the user object in localStorage to reflect the current passwordChangeRequired state
        const updatedUser = {
          ...data.user,
          passwordChangeRequired: data.user.passwordChangeRequired
        };
        
        // Store the user and token in localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('token', data.token);
        
        // Update state
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        throw new Error('Inicio de sesión fallido');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/force-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar la contraseña');
      }

      // Update user in state and localStorage to reflect password change
      if (user) {
        const updatedUser = {
          ...user,
          passwordChangeRequired: false
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
    
  
  const logout = async () => {
    try {
      // Call logout API endpoint
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data and token from localStorage regardless of API success
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  const hasRole = (role) => {
    if (!user || !user.role) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        login,
        logout,
        changePassword,
        hasPermission, 
        hasRole 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};