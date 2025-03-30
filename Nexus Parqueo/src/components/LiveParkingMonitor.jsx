import React, { useState, useEffect, useRef } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const LiveParkingMonitor = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  
  // Authentication
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  
  // Polling interval (10 seconds)
  const pollingIntervalRef = useRef(null);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    return timeString;
  };

  // Fetch all parking lots on component mount
  useEffect(() => {
    fetchParkingLots();
    
    // Set default dates (today and 7 days ago)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastWeek.toISOString().split('T')[0]);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
  // Fetch vehicle logs when parking or date selection changes
  useEffect(() => {
    if (selectedParkingId) {
      fetchVehicleLogs();
      
      // Set up polling for live view
      if (activeTab === 'live' && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchVehicleLogs, 10000); // Poll every 10 seconds
      }
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedParkingId, startDate, endDate, vehiclePlate, activeTab]);

  const fetchParkingLots = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/parkings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch parking lots');
      }
      
      const data = await response.json();
      setParkingLots(data);
      
      // Set the first parking lot as default selection
      if (data.length > 0 && !selectedParkingId) {
        setSelectedParkingId(data[0].parqueo_id);
      }
    } catch (err) {
      setError('Error fetching parking lots: ' + err.message);
    }
  };
  
  const fetchVehicleLogs = async () => {
    if (!selectedParkingId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      let queryParams = new URLSearchParams();
      
      if (activeTab === 'report') {
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (vehiclePlate) queryParams.append('plate', vehiclePlate);
      } else {
        // For live view, just get today's data
        const today = new Date().toISOString().split('T')[0];
        queryParams.append('startDate', today);
        queryParams.append('endDate', today);
      }
      
      queryParams.append('parkingId', selectedParkingId);
      
      const response = await fetch(`http://localhost:3001/api/parking-logs?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle logs');
      }
      
      const data = await response.json();
      setVehicleLogs(data);
    } catch (err) {
      setError('Error fetching vehicle logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    const parkingName = parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Unknown';
    doc.setFontSize(18);
    doc.text('Reporte de Movimientos de Vehículos', 14, 22);
    
    // Add filters info
    doc.setFontSize(12);
    doc.text(`Parqueo: ${parkingName}`, 14, 32);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 40);
    if (vehiclePlate) {
      doc.text(`Placa: ${vehiclePlate}`, 14, 48);
    }
    
    // Get only the data we want to display
    const tableData = vehicleLogs.map(log => [
      new Date(log.fecha).toLocaleDateString(),
      log.hora,
      log.numero_placa,
      log.tipo_movimiento,
      log.nombre_propietario || 'No registrado'
    ]);
    
    // Create the table
    doc.autoTable({
      startY: vehiclePlate ? 56 : 48,
      head: [['Fecha', 'Hora', 'Placa', 'Tipo', 'Propietario']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 71, 171], textColor: 255 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Reporte generado el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`reporte-parqueo-${parkingName}-${startDate}-${endDate}.pdf`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicleLogs();
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear polling when switching to report view
    if (tab === 'report' && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    } else if (tab === 'live' && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(fetchVehicleLogs, 10000);
      fetchVehicleLogs(); // Immediate fetch for live view
    }
  };
  
  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-6xl p-8">
        <div className="flex items-center justify-between mb-6">
          <img src={UlacitLogo} alt="Ulacit Logo" className="h-12" />
          <h1 className="text-2xl font-bold text-gray-900">
            Monitor de Movimientos de Parqueo
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'live'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleTabChange('live')}
              >
                Vista en Vivo
              </button>
              <button
                className={`ml-8 py-2 px-4 text-sm font-medium ${
                  activeTab === 'report'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleTabChange('report')}
              >
                Generar Reportes
              </button>
            </nav>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-1/3">
              <label htmlFor="parkingLot" className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Parqueo
              </label>
              <select
                id="parkingLot"
                value={selectedParkingId}
                onChange={(e) => setSelectedParkingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar parqueo...</option>
                {parkingLots.map(lot => (
                  <option key={lot.parqueo_id} value={lot.parqueo_id}>
                    {lot.nombre} - Espacios: {lot.capacidad_regulares + lot.capacidad_motos + lot.capacidad_ley7600}
                  </option>
                ))}
              </select>
            </div>
            
            {activeTab === 'report' && (
              <>
                <div className="w-full md:w-1/4">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="w-full md:w-1/4">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="w-full md:w-1/5">
                  <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700 mb-1">
                    Placa (opcional)
                  </label>
                  <input
                    type="text"
                    id="vehiclePlate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC123"
                    maxLength={7}
                  />
                </div>
                
                <div className="w-full flex justify-end space-x-4 mt-4">
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleGeneratePDF}
                    disabled={loading || vehicleLogs.length === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Generar PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {activeTab === 'live' && (
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-700">Movimientos en Tiempo Real</h2>
            <span className="text-sm text-gray-500">
              Actualización automática cada 10 segundos - Última actualización: {new Date().toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {vehicleLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicleLogs.map((log, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(log.fecha)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{formatTime(log.hora)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{log.numero_placa}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {log.tipo_movimiento === 'INGRESO' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Entrada
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Salida
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{log.nombre_propietario || 'No registrado'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          {log.motivo_rechazo ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800" title={log.motivo_rechazo}>
                              Rechazado
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Aceptado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-md">
                <p className="text-gray-600 font-medium">No hay movimientos registrados para los criterios seleccionados.</p>
                {activeTab === 'live' && (
                  <p className="text-gray-500 mt-2">Los movimientos nuevos aparecerán automáticamente.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveParkingMonitor;