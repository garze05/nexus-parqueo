import { useAuth } from '/src/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="fixed top-4 left-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded shadow-md transition-colors"
    >
      Cerrar Sesión
    </button>
  );
};

export default LogoutButton;