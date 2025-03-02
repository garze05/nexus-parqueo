import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackToDashboardButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/dashboard')}
      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded shadow-sm transition-colors"
    >
      Volver al Dashboard
    </button>
  );
};

export default BackToDashboardButton;
