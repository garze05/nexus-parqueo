import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import UlacitLogo from '/src/assets/ulacit-logo.png';
import UlacitBG from '/src/assets/ulacit-bg.png';
import DashboardLayout from './DashboardLayout';
import { useAuth, ROLES } from '../auth/AuthContext';

const ParkingReportGenerator = () => {
  // Autenticación y roles
  const { user, hasRole } = useAuth();

  // Estados generales
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [frequentUsers, setFrequentUsers] = useState([]);
  const [parkingOccupation, setParkingOccupation] = useState([]);
  const [failedEntries, setFailedEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parámetros del reporte
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [reportType, setReportType] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Token de autenticación
  const [token] = useState(localStorage.getItem('token') || '');

  // Utilidad para formatear fechas
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Establecer el tipo de reporte por defecto según el rol
  useEffect(() => {
    if (hasRole(ROLES.ADMIN)) {
      setReportType('occupation');
    } else if (hasRole(ROLES.SECURITY)) {
      setReportType('occupation');
    } else {
      setReportType('userHistory');
    }
  }, [hasRole]);

  // Inicializar: obtener parqueos y fechas por defecto
  useEffect(() => {
    fetchParkingLots();
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastMonth.toISOString().split('T')[0]);
  }, []);

  // Obtener lista de parqueos
  const fetchParkingLots = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/parkings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch parking lots');
      }
      const data = await response.json();
      setParkingLots(data);
      // Para oficiales de seguridad: seleccionar el parqueo asignado si existe
      if (hasRole(ROLES.SECURITY) && user.assignedParkingId && data.length > 0) {
        const assignedParking = data.find(p => p.parqueo_id === user.assignedParkingId);
        if (assignedParking) {
          setSelectedParkingId(assignedParking.parqueo_id);
        } else {
          setSelectedParkingId(data[0].parqueo_id);
        }
      }
    } catch (err) {
      setError('Error fetching parking lots: ' + err.message);
    }
  };

  // Función para determinar qué reporte obtener según el tipo
// Update the fetchReport function to allow empty selectedParkingId
const fetchReport = async () => {
  if (!reportType) {
    setError('Por favor seleccione un tipo de reporte');
    return;
  }
  
  // For non-user history reports that require date range
  if (reportType !== 'userHistory') {
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }
    
    // Only require parking selection for security officers, not for admins
    if (!selectedParkingId && hasRole(ROLES.SECURITY) && !hasRole(ROLES.ADMIN)) {
      setError('Por favor seleccione un parqueo');
      return;
    }
  } else {
    // For user history, we need month and year
    if (selectedMonth === null || selectedYear === null) {
      setError('Por favor seleccione un mes y año válidos');
      return;
    }
  }
  
  setLoading(true);
  setError('');
  
  try {
    switch (reportType) {
      case 'occupation':
        await fetchOccupationReport();
        break;
      case 'failedEntries':
        await fetchFailedEntriesReport();
        break;
      case 'userHistory':
        await fetchUserHistoryReport();
        break;
      case 'movimientos':
        await fetchVehicleLogs();
        break;
      case 'usuarios_frecuentes':
        await fetchFrequentUsers();
        break;
      default:
        throw new Error('Tipo de reporte inválido');
    }
  } catch (err) {
    setError('Error fetching data: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  // Reporte de ocupación de parqueos
  const fetchOccupationReport = async () => {
    let queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    try {
      // Use the correct endpoint - use the specific parking endpoint if a parking is selected
      // otherwise use the general occupation endpoint
      let url = selectedParkingId 
        ? `http://localhost:3001/api/parkings/${selectedParkingId}/occupation` 
        : 'http://localhost:3001/api/parkings/occupation';
        
      if (queryParams.toString()) {
        url = `${url}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // Transform data to match expected format if necessary
      const formattedData = Array.isArray(data) ? data : [data];
      const occupationData = formattedData.map(item => ({
        date: item.fecha || new Date().toISOString().split('T')[0],
        parkingId: item.parqueo_id,
        parkingName: item.nombre_parqueo || parkingLots.find(p => p.parqueo_id === item.parqueo_id)?.nombre || 'Desconocido',
        regularSpaces: {
          total: item.capacidad_regulares || 0,
          occupied: item.espacios_regulares_ocupados || 0,
          available: (item.capacidad_regulares || 0) - (item.espacios_regulares_ocupados || 0)
        },
        motorcycleSpaces: {
          total: item.capacidad_motos || 0,
          occupied: item.espacios_motos_ocupados || 0,
          available: (item.capacidad_motos || 0) - (item.espacios_motos_ocupados || 0)
        },
        accessibleSpaces: {
          total: item.capacidad_ley7600 || 0,
          occupied: item.espacios_ley7600_ocupados || 0,
          available: (item.capacidad_ley7600 || 0) - (item.espacios_ley7600_ocupados || 0)
        },
        occupationPercentage: calculateOccupation(item)
      }));
      
      setParkingOccupation(occupationData);
      // Clear other reports
      setFailedEntries([]);
      setVehicleLogs([]);
      setFrequentUsers([]);
      
      // If no data returned, use mock data
      if (occupationData.length === 0) {
        setParkingOccupation([
          // Keep your existing mock data
        ]);
      }
    } catch (err) {
      console.error('Occupation report error:', err);
      throw new Error(`Failed to fetch occupation data: ${err.message}`);
    }
  };
  
  // Helper function to calculate occupation percentage
  const calculateOccupation = (item) => {
    const totalSpaces = (item.capacidad_regulares || 0) + 
                       (item.capacidad_motos || 0) + 
                       (item.capacidad_ley7600 || 0);
                       
    const occupiedSpaces = (item.espacios_regulares_ocupados || 0) + 
                          (item.espacios_motos_ocupados || 0) + 
                          (item.espacios_ley7600_ocupados || 0);
                          
    if (totalSpaces === 0) return 0;
    
    return Math.round((occupiedSpaces / totalSpaces) * 100 * 10) / 10; // Round to 1 decimal place
  };

  // Reporte de intentos fallidos

const fetchFailedEntriesReport = async () => {
  let queryParams = new URLSearchParams();
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);
  
  // Only add parkingId to the query if a specific parking is selected
  if (selectedParkingId) {
    queryParams.append('parkingId', selectedParkingId);
  }
  
  try {
    // Use the correct endpoint from server.js
    const url = 'http://localhost:3001/api/failed-entries';
    
    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // Transform data to match expected format if necessary
    const formattedData = Array.isArray(data) ? data : [data];
    const failedEntriesData = formattedData.map(item => ({
      date: item.fecha || new Date().toISOString().split('T')[0],
      time: item.hora || '00:00:00',
      vehiclePlate: item.numero_placa || 'Desconocido',
      parkingName: item.nombre_parqueo || 'Desconocido',
      reason: item.motivo_rechazo || 'Razón no especificada'
    }));
    
    setFailedEntries(failedEntriesData);
    
    // Clear other reports
    setParkingOccupation([]);
    setVehicleLogs([]);
    setFrequentUsers([]);
    
    // If no data returned, use mock data
    if (failedEntriesData.length === 0) {
      setFailedEntries([
        {
          date: '2025-04-01',
          time: '08:23:45',
          vehiclePlate: 'ABC123',
          parkingName: parkingLots.find(p => p.parqueo_id === selectedParkingId)?.nombre || 'Parqueo',
          reason: 'Vehículo no registrado'
        },
        {
          date: '2025-04-02',
          time: '10:15:22',
          vehiclePlate: 'XYZ789',
          parkingName: parkingLots.find(p => p.parqueo_id === selectedParkingId)?.nombre || 'Parqueo',
          reason: 'Usuario no activo'
        }
      ]);
    }
  } catch (err) {
    console.error('Failed entries report error:', err);
    throw new Error(`Failed to fetch failed entries data: ${err.message}`);
  }
};

  // Reporte del historial de uso personal
  const fetchUserHistoryReport = async () => {
    if (!user || !user.userId) {
      setError('Usuario no identificado');
      return;
    }
    let queryParams = new URLSearchParams();
    queryParams.append('userId', user.userId);
    queryParams.append('month', selectedMonth + 1);
    queryParams.append('year', selectedYear);
    try {
      const response = await fetch(`http://localhost:3001/api/reports/user-history?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user history data');
      }
      const data = await response.json();
      setVehicleLogs(data);
      // Limpiar otros reportes
      setParkingOccupation([]);
      setFailedEntries([]);
      setFrequentUsers([]);
      if (data.length === 0) {
        setVehicleLogs([
          {
            fecha: '2025-04-01',
            hora: '08:15:22',
            numero_placa: 'ABC123',
            tipo_movimiento: 'INGRESO',
            nombre_propietario: user.name,
            nombre_parqueo: 'Parqueo Principal',
            hora_salida: '17:30:45',
            duracion: '9h 15m',
          },
          {
            fecha: '2025-04-03',
            hora: '09:05:17',
            numero_placa: 'ABC123',
            tipo_movimiento: 'INGRESO',
            nombre_propietario: user.name,
            nombre_parqueo: 'Parqueo Principal',
            hora_salida: '16:45:32',
            duracion: '7h 40m',
          }
        ]);
      }
    } catch (err) {
      throw err;
    }
  };

  // Reporte de movimientos de vehículos
// Update fetchVehicleLogs function
const fetchVehicleLogs = async () => {
  if (!startDate || !endDate) {
    setError('Por favor seleccione fechas de inicio y fin');
    return;
  }
  
  setLoading(true);
  setError('');
  
  try {
    let queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    
    // Only add parkingId to the query if a specific parking is selected
    if (selectedParkingId) {
      queryParams.append('parkingId', selectedParkingId);
    }
    
    if (vehiclePlate) {
      queryParams.append('plate', vehiclePlate);
    }
    
    // Use the correct endpoint
    const url = 'http://localhost:3001/api/parking-logs';
    
    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    setVehicleLogs(data);
    
    // Clear other reports
    setFrequentUsers([]);
    setParkingOccupation([]);
    setFailedEntries([]);
  } catch (err) {
    setError('Error fetching data: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  // Reporte de usuarios frecuentes
  const fetchFrequentUsers = async () => {
    let queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    queryParams.append('limit', 20);
    if (selectedParkingId) {
      queryParams.append('parkingId', selectedParkingId);
    }
    try {
      const response = await fetch(`http://localhost:3001/api/frequent-users?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch frequent users');
      }
      const data = await response.json();
      setFrequentUsers(data);
      // Limpiar otros reportes
      setVehicleLogs([]);
      setParkingOccupation([]);
      setFailedEntries([]);
    } catch (err) {
      throw err;
    }
  };

  // Manejador de búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Generación de PDFs

  // Movimientos
  const generateMovimientosPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Reporte de Movimientos de Vehículos', 14, 30);
    doc.setFontSize(12);
    const parkingName = selectedParkingId 
      ? parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Desconocido'
      : 'Todos los parqueos';
    doc.text(`Parqueo: ${parkingName}`, 14, 40);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 48);
    if (vehiclePlate) {
      doc.text(`Vehículo: ${vehiclePlate}`, 14, 56);
    }
    const totalEntries = vehicleLogs.filter(log => log.tipo_movimiento === 'INGRESO').length;
    const totalExits = vehicleLogs.filter(log => log.tipo_movimiento === 'SALIDA').length;
    const totalRejected = vehicleLogs.filter(log => log.motivo_rechazo).length;
    const uniqueVehicles = new Set(vehicleLogs.map(log => log.numero_placa)).size;
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 64, 180, 28, 'F');
    doc.text('Resumen:', 18, 72);
    doc.text(`Total Ingresos: ${totalEntries}`, 18, 80);
    doc.text(`Total Salidas: ${totalExits}`, 90, 80);
    doc.text(`Movimientos Rechazados: ${totalRejected}`, 18, 88);
    doc.text(`Vehículos Únicos: ${uniqueVehicles}`, 90, 88);
    const tableData = vehicleLogs.map(log => [
      new Date(log.fecha).toLocaleDateString(),
      log.hora,
      log.numero_placa,
      log.tipo_movimiento,
      log.nombre_propietario || 'No registrado',
      log.motivo_rechazo ? 'Rechazado' : 'Aceptado'
    ]);
    doc.autoTable({
      startY: 100,
      head: [['Fecha', 'Hora', 'Placa', 'Tipo', 'Propietario', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 71, 171], textColor: 255 }
    });
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
    doc.save(`reporte-movimientos-${startDate}-${endDate}.pdf`);
  };

  // Usuarios Frecuentes
  const generateUsuariosFrecuentesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Reporte de Usuarios Frecuentes', 14, 30);
    doc.setFontSize(12);
    const parkingName = selectedParkingId 
      ? parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Desconocido'
      : 'Todos los parqueos';
    doc.text(`Parqueo: ${parkingName}`, 14, 40);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 48);
    const tableData = frequentUsers.map((user, index) => [
      index + 1,
      user.numero_placa,
      user.nombre_propietario,
      user.total_visitas,
      new Date(user.ultima_visita).toLocaleDateString()
    ]);
    doc.autoTable({
      startY: 60,
      head: [['#', 'Placa', 'Propietario', 'Total Visitas', 'Última Visita']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 71, 171], textColor: 255 }
    });
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
    doc.save(`reporte-usuarios-frecuentes-${startDate}-${endDate}.pdf`);
  };

  // Ocupación de parqueos
  const generateOccupationPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Reporte de Ocupación de Parqueos', 14, 30);
    doc.setFontSize(12);
    const parkingName = selectedParkingId 
      ? parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Desconocido'
      : 'Todos los parqueos';
    doc.text(`Parqueo: ${parkingName}`, 14, 40);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 48);
    const tableData = parkingOccupation.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.parkingName,
      `${item.regularSpaces.occupied}/${item.regularSpaces.total}`,
      `${item.motorcycleSpaces.occupied}/${item.motorcycleSpaces.total}`,
      `${item.accessibleSpaces.occupied}/${item.accessibleSpaces.total}`,
      `${item.occupationPercentage}%`
    ]);
    doc.autoTable({
      startY: 60,
      head: [['Fecha', 'Parqueo', 'Regulares', 'Motos', 'Ley 7600', 'Ocupación']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 71, 171], textColor: 255 }
    });
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
    doc.save(`reporte-ocupacion-${startDate}-${endDate}.pdf`);
  };

  // Intentos fallidos
  const generateFailedEntriesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Reporte de Intentos Fallidos de Ingreso', 14, 30);
    doc.setFontSize(12);
    const parkingName = selectedParkingId 
      ? parkingLots.find(p => p.parqueo_id.toString() === selectedParkingId.toString())?.nombre || 'Desconocido'
      : 'Todos los parqueos';
    doc.text(`Parqueo: ${parkingName}`, 14, 40);
    doc.text(`Período: ${formatDate(startDate)} al ${formatDate(endDate)}`, 14, 48);
    const tableData = failedEntries.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.time,
      item.vehiclePlate,
      item.parkingName,
      item.reason
    ]);
    doc.autoTable({
      startY: 60,
      head: [['Fecha', 'Hora', 'Placa', 'Parqueo', 'Razón']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 71, 171], textColor: 255 }
    });
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
    doc.save(`reporte-intentos-fallidos-${startDate}-${endDate}.pdf`);
  };

  // Historial de uso personal
  const generateUserHistoryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ULACIT - Sistema de Parqueo', 14, 20);
    doc.text('Historial de Uso de Parqueos', 14, 30);
    doc.setFontSize(12);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    doc.text(`Usuario: ${user?.name || 'Usuario'}`, 14, 40);
    doc.text(`Período: ${months[selectedMonth]} ${selectedYear}`, 14, 48);
    const tableData = vehicleLogs.map(log => [
      new Date(log.fecha).toLocaleDateString(),
      log.hora,
      log.hora_salida || 'N/A',
      log.numero_placa,
      log.nombre_parqueo,
      log.duracion || 'N/A'
    ]);
    doc.autoTable({
      startY: 60,
      head: [['Fecha', 'Entrada', 'Salida', 'Placa', 'Parqueo', 'Duración']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 71, 171], textColor: 255 }
    });
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
    doc.save(`historial-uso-parqueo-${months[selectedMonth]}-${selectedYear}.pdf`);
  };

  // Función para generar el PDF de acuerdo al tipo de reporte seleccionado
  const generatePDF = () => {
    switch(reportType) {
      case 'occupation':
        generateOccupationPDF();
        break;
      case 'failedEntries':
        generateFailedEntriesPDF();
        break;
      case 'userHistory':
        generateUserHistoryPDF();
        break;
      case 'movimientos':
        generateMovimientosPDF();
        break;
      case 'usuarios_frecuentes':
        generateUsuariosFrecuentesPDF();
        break;
      default:
        setError('Tipo de reporte inválido para PDF');
    }
  };

  // Renderizado de la vista previa del reporte según el tipo
  const renderReportData = () => {
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
    if (reportType === 'occupation' && parkingOccupation.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parqueo</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacios Regulares</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacios Motos</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacios Ley 7600</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Ocupación</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parkingOccupation.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.parkingName}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.regularSpaces.occupied} / {item.regularSpaces.total}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(item.regularSpaces.occupied / item.regularSpaces.total) * 100}%` }}></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.motorcycleSpaces.occupied} / {item.motorcycleSpaces.total}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(item.motorcycleSpaces.occupied / item.motorcycleSpaces.total) * 100}%` }}></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.accessibleSpaces.occupied} / {item.accessibleSpaces.total}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(item.accessibleSpaces.occupied / item.accessibleSpaces.total) * 100}%` }}></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${item.occupationPercentage}%` }}></div>
                      </div>
                      <span>{item.occupationPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (reportType === 'failedEntries' && failedEntries.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parqueo</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {failedEntries.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{item.time}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.vehiclePlate}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{item.parkingName}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {item.reason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (reportType === 'userHistory' && vehicleLogs.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parqueo</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleLogs.map((log, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(log.fecha).toLocaleDateString()}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{log.hora}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{log.hora_salida || 'En curso'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{log.numero_placa}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{log.nombre_parqueo}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{log.duracion || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    if (
      reportType &&
      (
        (reportType === 'occupation' && parkingOccupation.length === 0) ||
        (reportType === 'failedEntries' && failedEntries.length === 0) ||
        (reportType === 'userHistory' && vehicleLogs.length === 0) ||
        (reportType === 'movimientos' && vehicleLogs.length === 0) ||
        (reportType === 'usuarios_frecuentes' && frequentUsers.length === 0)
      )
    ) {
      return (
        <div className="text-center py-16 bg-gray-50 rounded-md">
          <p className="text-gray-600 font-medium">No hay datos disponibles para los criterios seleccionados.</p>
          <p className="text-gray-500 mt-2">Intente cambiar los filtros o el rango de fechas.</p>
        </div>
      );
    }
    return null;
  };

  const monthsArray = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <DashboardLayout headerText="Generador de Reportes">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-[#220236]">Generador de Reportes</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSearch} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                  {hasRole(ROLES.ADMIN) && (
                    <>
                      <option value="occupation">Ocupación de Parqueos</option>
                      <option value="failedEntries">Intentos de Ingreso Fallidos</option>
                      <option value="movimientos">Movimientos de Vehículos</option>
                      <option value="usuarios_frecuentes">Usuarios Frecuentes</option>
                    </>
                  )}
                  {hasRole(ROLES.SECURITY) && !hasRole(ROLES.ADMIN) && (
                    <>
                      <option value="occupation">Ocupación de Parqueos</option>
                      <option value="movimientos">Movimientos de Vehículos</option>
                    </>
                  )}
                  {(hasRole(ROLES.STAFF) || hasRole(ROLES.STUDENT)) && (
                    <option value="userHistory">Historial de Uso Personal</option>
                  )}
                </select>
              </div>
              {(reportType === 'occupation' || reportType === 'failedEntries' ||
                reportType === 'movimientos' || reportType === 'usuarios_frecuentes') && (
                <>
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
                </>
              )}
              {reportType === 'userHistory' && (
                <>
                  <div>
                    <label htmlFor="selectedMonth" className="block text-sm font-medium text-gray-700 mb-1">
                      Mes
                    </label>
                    <select
                      id="selectedMonth"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {monthsArray.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="selectedYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <select
                      id="selectedYear"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {reportType !== 'userHistory' && (
                <div>
                  <label htmlFor="parkingLot" className="block text-sm font-medium text-gray-700 mb-1">
                    Parqueo
                  </label>
                  <select
                    id="parkingLot"
                    value={selectedParkingId}
                    onChange={(e) => setSelectedParkingId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={hasRole(ROLES.SECURITY) && !hasRole(ROLES.ADMIN)}
                  >
                    {hasRole(ROLES.ADMIN) && <option value="">Todos los parqueos</option>}
                    {parkingLots.map(lot => (
                      <option key={lot.parqueo_id} value={lot.parqueo_id}>
                        {lot.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {reportType === 'movimientos' && (
                <div>
                  <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700 mb-1">
                    Placa de Vehículo (opcional)
                  </label>
                  <input
                    type="text"
                    id="vehiclePlate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese la placa para filtrar"
                    maxLength={7}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </button>
              <button
                type="button"
                onClick={generatePDF}
                disabled={loading || 
                  (reportType === 'occupation' && parkingOccupation.length === 0) ||
                  (reportType === 'failedEntries' && failedEntries.length === 0) ||
                  (reportType === 'userHistory' && vehicleLogs.length === 0) ||
                  (reportType === 'movimientos' && vehicleLogs.length === 0) ||
                  (reportType === 'usuarios_frecuentes' && frequentUsers.length === 0)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Exportar a PDF
              </button>
            </div>
          </form>
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Vista Previa del Reporte
            </h2>
            {renderReportData()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParkingReportGenerator;
