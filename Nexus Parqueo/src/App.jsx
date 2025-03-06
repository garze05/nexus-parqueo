import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ROLES, PERMISSIONS } from './auth/roles';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import ChangePassword from './components/ChangePassword';
import Unauthorized from './components/Unauthorized';
import VehicleControl from './components/VehicleControl';
import MyVehicles from './components/MyVehicles';
import SelectParking from './components/SelectParking';
import RegisterVehicle from './components/RegisterVehicle';
import UserManagement from './components/UserManagement';
import CheckVehiculos from './components/CheckVehiculos';

// import UserManagement from './components/UserManagement';
// import History from './components/History';
// import FailedEntries from './components/FailedEntries';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes that require authentication */}
          <Route path="/force-change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/register" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <Register />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              {/* <UserManagement /> */}
              <UserManagement />
            </ProtectedRoute>
          } />
         
          <Route path="/parking-lots" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              {/* <ParkingManagement /> */}
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Gestión de Parqueos</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/reports/failed-entries" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              {/* <FailedEntries /> */}
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Reporte de Intentos Fallidos</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />

          {/* Additional admin routes for the new features */}
          <Route path="/manage-vehicles" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Administrar Vehículos</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/vehicles/register" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <RegisterVehicle />
            </ProtectedRoute>
          } />
          
          <Route path="/parking-stats" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Estadísticas de Uso</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/system-settings" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Configuración del Sistema</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/system-logs" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Bitácora del Sistema</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Security guard routes */}
          <Route path="/vehicle-control" element={
            <ProtectedRoute requiredRole={ROLES.SECURITY}>
              <VehicleControl />
            </ProtectedRoute>
          } />

          <Route path="/vehicle-check" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.CHECK_VEHICLES}>
              <CheckVehiculos />
            </ProtectedRoute>
          } />
          
          <Route path="/select-parking" element={
            <ProtectedRoute requiredRole={ROLES.SECURITY}>
              <SelectParking />
            </ProtectedRoute>
          } />
          
          {/* Additional security staff routes */}
          <Route path="/vehicle-entry" element={
            <ProtectedRoute requiredRole={ROLES.SECURITY}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Ingreso de Vehículos</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/vehicle-exit" element={
            <ProtectedRoute requiredRole={ROLES.SECURITY}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Salida de Vehículos</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/staff-reports" element={
            <ProtectedRoute requiredRole={ROLES.SECURITY}>
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Reportes de Ocupación</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Staff and student routes */}
          <Route path="/my-vehicles" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_PROFILE}>
              <MyVehicles />
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD}>
              {/* <History /> */}
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Historial de Uso</h2>
                <p className="text-gray-600">Esta sección está en desarrollo.</p>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;