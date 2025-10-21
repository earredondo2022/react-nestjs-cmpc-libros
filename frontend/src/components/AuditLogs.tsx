import React, { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  action: string;
  tableName: string;
  recordId?: string;
  userId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

interface AuditStats {
  totalLogs: number;
  actionStats: { action: string; count: number }[];
  tableStats: { tableName: string; count: number }[];
  recentActivity: AuditLog[];
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');

  // Filtros
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    tableName: '',
    startDate: '',
    endDate: '',
    ipAddress: '',
  });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      // Add non-empty filters
      if (filters.userId.trim()) params.append('userId', filters.userId);
      if (filters.action.trim()) params.append('action', filters.action);
      if (filters.tableName.trim()) params.append('tableName', filters.tableName);
      if (filters.startDate.trim()) params.append('startDate', filters.startDate);
      if (filters.endDate.trim()) params.append('endDate', filters.endDate);
      if (filters.ipAddress.trim()) params.append('ipAddress', filters.ipAddress);

      const response = await fetch(`http://localhost:3001/api/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AuditResponse = await response.json();
        setLogs(data.logs);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        setError('Error al cargar los logs de auditoría');
      }
    } catch (err) {
      setError('Error de conexión al cargar los logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/audit/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AuditStats = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    }
  };

  const exportToCsv = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.userId.trim()) params.append('userId', filters.userId);
      if (filters.action.trim()) params.append('action', filters.action);
      if (filters.tableName.trim()) params.append('tableName', filters.tableName);
      if (filters.startDate.trim()) params.append('startDate', filters.startDate);
      if (filters.endDate.trim()) params.append('endDate', filters.endDate);
      if (filters.ipAddress.trim()) params.append('ipAddress', filters.ipAddress);

      const response = await fetch(`http://localhost:3001/api/audit/export/csv?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Error al exportar logs');
      }
    } catch (err) {
      setError('Error de conexión al exportar');
      console.error('Error exporting audit logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'READ': return 'bg-gray-100 text-gray-800';
      case 'EXPORT': return 'bg-purple-100 text-purple-800';
      case 'LOGIN': return 'bg-yellow-100 text-yellow-800';
      case 'LOGOUT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLogsTab = () => (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="ID Usuario"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DELETE">Eliminar</option>
            <option value="READ">Leer</option>
            <option value="EXPORT">Exportar</option>
            <option value="LOGIN">Iniciar Sesión</option>
            <option value="LOGOUT">Cerrar Sesión</option>
          </select>
          <input
            type="text"
            placeholder="Tabla"
            value={filters.tableName}
            onChange={(e) => setFilters({ ...filters, tableName: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="Fecha inicio"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="Fecha fin"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="IP Address"
            value={filters.ipAddress}
            onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilters({
              userId: '',
              action: '',
              tableName: '',
              startDate: '',
              endDate: '',
              ipAddress: '',
            })}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={exportToCsv}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Logs de Auditoría ({total} registros)
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">Cargando logs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron logs</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.tableName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <details className="cursor-pointer">
                        <summary className="font-medium">Ver detalles</summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          {log.recordId && <p><strong>ID Registro:</strong> {log.recordId}</p>}
                          {log.oldValues && (
                            <div>
                              <strong>Valores Anteriores:</strong>
                              <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.oldValues, null, 2)}</pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <strong>Valores Nuevos:</strong>
                              <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.newValues, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {stats ? (
        <>
          {/* Resumen general */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen General</h3>
            <div className="text-3xl font-bold text-blue-600">{stats.totalLogs}</div>
            <div className="text-gray-600">Total de registros de auditoría</div>
          </div>

          {/* Estadísticas por acción */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas por Acción</h3>
            <div className="space-y-2">
              {stats.actionStats.map((stat) => (
                <div key={stat.action} className="flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(stat.action)}`}>
                    {stat.action}
                  </span>
                  <span className="font-medium">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas por tabla */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas por Tabla</h3>
            <div className="space-y-2">
              {stats.tableStats.map((stat) => (
                <div key={stat.tableName} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stat.tableName}</span>
                  <span className="font-medium">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              {stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-sm font-medium">{log.tableName}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          Cargando estadísticas...
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
        <p className="text-gray-600 mt-2">
          Monitoreo y seguimiento de todas las operaciones del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Logs de Auditoría
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estadísticas
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'logs' ? renderLogsTab() : renderStatsTab()}
    </div>
  );
};

export default AuditLogs;