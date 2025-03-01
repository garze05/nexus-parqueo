import React, { createContext, useContext, useState, useEffect } from 'react';

// Define role constants
export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  SECURITY: 'OFICIAL_SEGURIDAD',
  STAFF: 'PERSONAL_ADMINISTRATIVO',
  STUDENT: 'ESTUDIANTE'
};

// Define permissions
export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_VEHICLES: 'manage_vehicles',
  REGISTER_ENTRY_EXIT: 'register_entry_exit',
  VIEW_OCCUPATION: 'view_occupation',
  VIEW_HISTORY: 'view_history',
  VIEW_FAILED_ENTRIES: 'view_failed_entries'
};

// Role-permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_OCCUPATION,
    PERMISSIONS.VIEW_FAILED_ENTRIES,
    PERMISSIONS.VIEW_HISTORY
  ],
  [ROLES.SECURITY]: [
    PERMISSIONS.REGISTER_ENTRY_EXIT,
    PERMISSIONS.VIEW_OCCUPATION
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_HISTORY
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_HISTORY
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
        // Store the user and token in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Update state
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        throw new Error('Inicio de sesión fallido');
      }
    } catch (error) {
      return { success: false, error: error.message };
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
        hasPermission, 
        hasRole 
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}