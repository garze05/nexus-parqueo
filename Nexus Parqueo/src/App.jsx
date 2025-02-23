import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute'
import { PERMISSIONS, ROLES } from './auth/roles';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';

function App() {

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log('Authentication state:', isAuthenticated);

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/"element={<Navigate to="/login" replace />}/>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<ProtectedRoute requiredRole={ROLES.ADMIN}><Register /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD}><Dashboard /></ProtectedRoute>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;