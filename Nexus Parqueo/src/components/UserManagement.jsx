import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UlacitLogo from '/src/assets/ulacit-logo.png';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    correo_electronico: '',
    fecha_nacimiento: '',
    identificacion: '',
    numero_carne: '',
    rol_id: '',
    activo: true
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch users and roles on component mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar usuarios. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch roles
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener roles');
      }
      
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Error al cargar roles. Por favor, intente de nuevo.');
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle form submission for creating a new user
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.nombre || !formData.correo_electronico || !formData.fecha_nacimiento || 
        !formData.identificacion || !formData.rol_id) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = formMode === 'edit' && selectedUser 
        ? `http://localhost:3001/api/users/${selectedUser.usuario_id}` 
        : 'http://localhost:3001/api/users';
      
      const method = formMode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }
      
      setSuccess(formMode === 'edit' ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      
      // Reset form and refresh user list
      resetForm();
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit button click
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      nombre: user.nombre,
      correo_electronico: user.correo_electronico,
      fecha_nacimiento: user.fecha_nacimiento ? user.fecha_nacimiento.substring(0, 10) : '',
      identificacion: user.identificacion,
      numero_carne: user.numero_carne || '',
      rol_id: user.rol_id.toString(),
      activo: user.activo === 1
    });
    setFormMode('edit');
    setShowForm(true);
  };
  
  // Handle toggle active status
  const handleToggleActive = async (userId, currentStatus) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ active: !currentStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar estado');
      }
      
      setSuccess('Estado del usuario actualizado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      setError(error.message || 'Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      nombre: '',
      correo_electronico: '',
      fecha_nacimiento: '',
      identificacion: '',
      numero_carne: '',
      rol_id: '',
      activo: true
    });
    setSelectedUser(null);
    setFormMode('');
  };

  // Add a new user
  const handleAddUser = () => {
    resetForm();
    setFormMode('add');
    setShowForm(true);
  };

  // Cancel form
  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.rol_id === roleId);
    return role ? role.nombre_rol : 'Desconocido';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img src={UlacitLogo} alt="Ulacit Logo" className="h-10 mr-4" />
            <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Usuarios del Sistema</h2>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm transition-colors"
            >
              Agregar Usuario
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          {/* User Form */}
          {showForm && (
            <div className="bg-gray-50 p-6 rounded-lg border mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {formMode === 'edit' ? 'Editar Usuario' : 'Agregar Usuario'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                      Nombre Completo*
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="correo_electronico" className="block text-sm font-medium text-gray-700">
                      Correo Electrónico*
                    </label>
                    <input
                      id="correo_electronico"
                      name="correo_electronico"
                      type="email"
                      value={formData.correo_electronico}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">
                      Fecha de Nacimiento*
                    </label>
                    <input
                      id="fecha_nacimiento"
                      name="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="identificacion" className="block text-sm font-medium text-gray-700">
                      Identificación*
                    </label>
                    <input
                      id="identificacion"
                      name="identificacion"
                      type="text"
                      value={formData.identificacion}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="numero_carne" className="block text-sm font-medium text-gray-700">
                      Número de Carné
                    </label>
                    <input
                      id="numero_carne"
                      name="numero_carne"
                      type="text"
                      value={formData.numero_carne}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="rol_id" className="block text-sm font-medium text-gray-700">
                      Rol*
                    </label>
                    <select
                      id="rol_id"
                      name="rol_id"
                      value={formData.rol_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione un rol</option>
                      {roles.map((role) => (
                        <option key={role.rol_id} value={role.rol_id}>
                          {role.nombre_rol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {formMode === 'edit' && (
                  <div className="flex items-center">
                    <input
                      id="activo"
                      name="activo"
                      type="checkbox"
                      checked={formData.activo}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                      Usuario Activo
                    </label>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
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
                    {loading ? 'Procesando...' : formMode === 'edit' ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Users Table */}
          {loading && !users.length ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Correo</th>
                    <th className="py-3 px-4 text-left">Identificación</th>
                    <th className="py-3 px-4 text-left">Carné</th>
                    <th className="py-3 px-4 text-left">Rol</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.usuario_id}>
                      <td className="py-3 px-4 font-medium">{user.nombre}</td>
                      <td className="py-3 px-4">{user.correo_electronico}</td>
                      <td className="py-3 px-4">{user.identificacion}</td>
                      <td className="py-3 px-4">{user.numero_carne || '-'}</td>
                      <td className="py-3 px-4">{user.nombre_rol}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.activo === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.activo === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleActive(user.usuario_id, user.activo === 1)}
                            className={`${
                              user.activo === 1 
                                ? 'text-red-600 hover:text-red-800' 
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {user.activo === 1 ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Información de Usuarios</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              <span className="font-semibold">Roles del sistema:</span>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Administrador:</strong> Acceso completo al sistema, gestión de usuarios y parqueos.</li>
              <li><strong>Oficial de Seguridad:</strong> Control de ingreso y salida de vehículos.</li>
              <li><strong>Personal Administrativo:</strong> Acceso a reportes y gestión de vehículos propios.</li>
              <li><strong>Estudiante:</strong> Acceso a reportes y gestión de vehículos propios.</li>
            </ul>
            <p className="text-gray-600 mt-4">
              <span className="font-semibold">Nota:</span> Los usuarios nuevos se crean con la contraseña predeterminada "Ulacit123" y deben cambiarla en su primer inicio de sesión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;