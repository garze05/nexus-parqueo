import React, { useState, useEffect } from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ParkingReportGenerator = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [frequentUsers, setFrequentUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Report parameters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [reportType, setReportType] = useState('movimientos');
  
  // Authentication
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Initialize with default dates
  useEffect(() => {
    fetchParkingLots();
    
    // Set default dates (today and 30 days ago)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastMonth.toISOString().split('T')[0]);
  }, []);

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
    } catch (err) {
      setError('Error fetching parking lots: ' + err.message);
    }
  };
  
  const fetchVehicleLogs = async () => {
    if (!selectedParkingId && reportType !== 'usuarios_frecuentes') {
      setError('Por favor seleccione un parqueo');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (reportType === 'usuarios_frecuentes') {
        await fetchFrequentUsers();
      } else {
        // Build query parameters
        let queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        
        if (selectedParkingId) {
          queryParams.append('parkingId', selectedParkingId);
        }
        
        if (vehiclePlate) {
          queryParams.append('plate', vehiclePlate);
        }
        
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
        setFrequentUsers([]);
      }
    } catch (err) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFrequentUsers = async () => {
    // Build query parameters
    let queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    queryParams.append('limit', 20); // Top 20 users
    
    if (selectedParkingId) {
      queryParams.append('parkingId', selectedParkingId);
    }
    
    const response = await fetch(`http://localhost:3001/api/frequent-users?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch frequent users');
    }
    
    const data = await response.json();
    setFrequentUsers(data);
    setVehicleLogs([]);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicleLogs();
  };
  
  const generateMovimientosPDF = () => {
    const doc = new jsPDF();
    
    // Add title and logo
    // In a real-world scenario, you would add the logo image
    // doc.addImage(UlacitLogo, 'PNG', 14, 10, 30, 15);
    
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Reporte de Movimientos de Vehículos', 14, 30);
    
    // Add metadata
    doc.setFontSize(12);
    
    const parkingName = selectedParkingId 
      ? parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Desconocido'
      : 'Todos los parqueos';
      
    doc.text(`Parqueo: ${parkingName}`, 14, 40);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 48);
    
    if (vehiclePlate) {
      doc.text(`Vehículo: ${vehiclePlate}`, 14, 56);
    }
    
    // Create summary statistics
    const totalEntries = vehicleLogs.filter(log => log.tipo_movimiento === 'INGRESO').length;
    const totalExits = vehicleLogs.filter(log => log.tipo_movimiento === 'SALIDA').length;
    const totalRejected = vehicleLogs.filter(log => log.motivo_rechazo).length;
    const uniqueVehicles = new Set(vehicleLogs.map(log => log.numero_placa)).size;
    
    // Add summary box
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 64, 180, 28, 'F');
    
    doc.text('Resumen:', 18, 72);
    doc.text(`Total Ingresos: ${totalEntries}`, 18, 80);
    doc.text(`Total Salidas: ${totalExits}`, 90, 80);
    doc.text(`Movimientos Rechazados: ${totalRejected}`, 18, 88);
    doc.text(`Vehículos Únicos: ${uniqueVehicles}`, 90, 88);
    
    // Table data
    const tableData = vehicleLogs.map(log => [
      new Date(log.fecha).toLocaleDateString(),
      log.hora,
      log.numero_placa,
      log.tipo_movimiento,
      log.nombre_propietario || 'No registrado',
      log.motivo_rechazo ? 'Rechazado' : 'Aceptado'
    ]);
    
    // Create the table
    doc.autoTable({
      startY: 100,
      head: [['Fecha', 'Hora', 'Placa', 'Tipo', 'Propietario', 'Estado']],
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
    doc.save(`reporte-movimientos-${startDate}-${endDate}.pdf`);
  };
  
  const generateUsuariosFrecuentesPDF = () => {
    const doc = new jsPDF();
    
    // Add title and logo
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Reporte de Usuarios Frecuentes', 14, 30);
    
    // Add metadata
    doc.setFontSize(12);
    
    const parkingName = selectedParkingId 
      ? parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Desconocido'
      : 'Todos los parqueos';
      
    doc.text(`Parqueo: ${parkingName}`, 14, 40);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 48);
    
    // Table data
    const tableData = frequentUsers.map((user, index) => [
      index + 1,
      user.numero_placa,
      user.nombre_propietario,
      user.total_visitas,
      new Date(user.ultima_visita).toLocaleDateString()
    ]);
    
    // Create the table
    doc.autoTable({
      startY: 60,
      head: [['#', 'Placa', 'Propietario', 'Total Visitas', 'Última Visita']],
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
    doc.save(`reporte-usuarios-frecuentes-${startDate}-${endDate}.pdf`);
  };
  
  const handleGeneratePDF = () => {
    if (reportType === 'usuarios_frecuentes') {
      if (frequentUsers.length === 0) {
        setError('No hay datos para generar el reporte');
        return;
      }
      generateUsuariosFrecuentesPDF();
    } else {
      if (vehicleLogs.length === 0) {
        setError('No hay datos para generar el reporte');
        return;
      }
      generateMovimientosPDF();
    }
  };
  
  const renderDataTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    
    if (reportType === 'usuarios_frecuentes' && frequentUsers.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visitas</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Visita</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {frequentUsers.map((user, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{user.numero_placa}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{user.nombre_propietario}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{user.total_visitas}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(user.ultima_visita).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (reportType === 'movimientos' && vehicleLogs.length > 0) {
      return (
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
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(log.fecha).toLocaleDateString()}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{log.hora}</td>
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
      );
    }
    
    if ((reportType === 'movimientos' && vehicleLogs.length === 0) ||
        (reportType === 'usuarios_frecuentes' && frequentUsers.length === 0)) {
      return (
        <div className="text-center py-16 bg-gray-50 rounded-md">
          <p className="text-gray-600 font-medium">No hay datos disponibles para los criterios seleccionados.</p>
          <p className="text-gray-500 mt-2">Intente cambiar los filtros o el rango de fechas.</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${UlacitBG})` }}>
      <div className="bg-white rounded-lg shadow-md w-full max-w-6xl p-8">
        <div className="flex items-center justify-between mb-6">
          <img src={UlacitLogo} alt="Ulacit Logo" className="h-12" />
          <h1 className="text-2xl font-bold text-gray-900">
            Generador de Reportes de Parqueo
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Reporte
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="movimientos">Movimientos de Vehículos</option>
                <option value="usuarios_frecuentes">Usuarios Frecuentes</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="parkingLot" className="block text-sm font-medium text-gray-700 mb-1">
                Parqueo
              </label>
              <select
                id="parkingLot"
                value={selectedParkingId}
                onChange={(e) => setSelectedParkingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los parqueos</option>
                {parkingLots.map(lot => (
                  <option key={lot.parqueo_id} value={lot.parqueo_id}>
                    {lot.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
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
            
            <div>
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
          </div>
          
          {reportType === 'movimientos' && (
            <div className="mb-4">
              <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700 mb-1">
                Placa de Vehículo (opcional)
              </label>
              <input
                type="text"
                id="vehiclePlate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese la placa para filtrar por vehículo"
                maxLength={7}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={loading || (reportType === 'movimientos' && vehicleLogs.length === 0) || (reportType === 'usuarios_frecuentes' && frequentUsers.length === 0)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Generar PDF
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Vista Previa de Datos
          </h2>
          
          {renderDataTable()}
        </div>
      </div>
    </div>
  );
};

export default ParkingReportGenerator;