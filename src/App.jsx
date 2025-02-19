import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';

function App() {

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log('Authentication state:', isAuthenticated);

    return (
        <Router>
            <Routes>
                <Route path="/"element={<Navigate to="/login" replace />}/>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;