import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log('Authentication state:', isAuthenticated);

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
                />
                <Route
                    path="/dashboard"
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
                />
            </Routes>
        </Router>
    );
}

export default App;