import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import './PingHistoryModal.css';

const PingHistoryModal = ({ website, isOpen, onClose, onWebsiteUpdate }) => {
  const [pingHistory, setPingHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPausing, setIsPausing] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'timestamp',
    sortOrder: 'desc',
    filterDate: '',
    status: '',
    limit: 100
  });

  useEffect(() => {
    if (isOpen && website) {
      fetchPingHistory();
    }
  }, [isOpen, website, filters]);

  const fetchPingHistory = async () => {
    if (!website?._id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getPingHistory(website._id, filters);
      setPingHistory(data.pingHistory || []);
      setStatistics(data.statistics || {});
    } catch (error) {
      console.error('Failed to fetch ping history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'timestamp',
      sortOrder: 'desc',
      filterDate: '',
      status: '',
      limit: 100
    });
  };

  const handleTogglePause = async () => {
    setIsPausing(true);
    
    try {
      let response;
      if (website.isTemporarilyStopped) {
        response = await apiService.resumeWebsite(website._id);
      } else {
        response = await apiService.pauseWebsite(website._id);
      }
      
      // Update the parent component with the new website data
      if (onWebsiteUpdate) {
        onWebsiteUpdate(response.data);
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    } finally {
      setIsPausing(false);
    }
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return '#10b981'; // Green for 2xx
    if (statusCode >= 300 && statusCode < 400) return '#f59e0b'; // Yellow for 3xx
    if (statusCode >= 400 && statusCode < 500) return '#ef4444'; // Red for 4xx
    if (statusCode >= 500) return '#dc2626'; // Dark red for 5xx
    return '#6b7280'; // Gray for 0 or unknown
  };

  const getStatusIcon = (statusCode) => {
    if (statusCode >= 200 && statusCode < 400) return '✅';
    if (statusCode === 0) return '💥';
    return '❌';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (duration) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Modal */}
          <motion.div
            className="ping-history-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <h2>Ping History</h2>
                <p>{website?.name} ({website?.url})</p>
                {website?.isTemporarilyStopped && (
                  <span className="paused-indicator">⏸️ Monitoring Paused</span>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  className={`modal-pause-btn ${website?.isTemporarilyStopped ? 'resumed' : 'paused'}`}
                  onClick={handleTogglePause}
                  disabled={isPausing}
                  title={website?.isTemporarilyStopped ? 'Resume monitoring' : 'Pause monitoring'}
                >
                  {isPausing ? '⏳' : (website?.isTemporarilyStopped ? '▶️' : '⏸️')}
                </button>
                <button className="modal-close" onClick={onClose}>
                  ✕
                </button>
              </div>
            </div>

            {/* Statistics Summary */}
            {statistics && (
              <div className="statistics-summary">
                <div className="stat-card">
                  <span className="stat-value">{statistics.totalPings}</span>
                  <span className="stat-label">Total Pings</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value" style={{ color: '#10b981' }}>{statistics.successfulPings}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value" style={{ color: '#ef4444' }}>{statistics.failedPings}</span>
                  <span className="stat-label">Failed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{statistics.uptimePercentage}%</span>
                  <span className="stat-label">Uptime</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{statistics.averageResponseTime}ms</span>
                  <span className="stat-label">Avg Response</span>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="filters-section">
              <div className="filters-row">
                <div className="filter-group">
                  <label>Sort By:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="timestamp">Date & Time</option>
                    <option value="duration">Response Time</option>
                    <option value="statusCode">Status Code</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Order:</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <option value="desc">Latest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status:</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="up">Up Only</option>
                    <option value="down">Down Only</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={filters.filterDate}
                    onChange={(e) => handleFilterChange('filterDate', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Limit:</label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  >
                    <option value={50}>50 entries</option>
                    <option value={100}>100 entries</option>
                    <option value={200}>200 entries</option>
                    <option value={0}>All entries</option>
                  </select>
                </div>

                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="modal-content">
              {loading ? (
                <div className="loading-container">
                  <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⟳
                  </motion.div>
                  <p>Loading ping history...</p>
                </div>
              ) : error ? (
                <div className="error-container">
                  <span className="error-icon">⚠️</span>
                  <p>{error}</p>
                  <button onClick={fetchPingHistory} className="retry-btn">
                    Try Again
                  </button>
                </div>
              ) : pingHistory.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <h3>No Ping Data</h3>
                  <p>No ping history found for the selected filters.</p>
                </div>
              ) : (
                <div className="ping-history-list">
                  <div className="ping-history-header">
                    <span className="header-status">Status</span>
                    <span className="header-timestamp">Date & Time</span>
                    <span className="header-code">Code</span>
                    <span className="header-duration">Response Time</span>
                  </div>
                  
                  <div className="ping-history-content">
                    <AnimatePresence>
                      {pingHistory.map((ping, index) => (
                        <motion.div
                          key={`${ping.timestamp}-${index}`}
                          className="ping-entry"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                        >
                          <div className="ping-status">
                            <span 
                              className="status-indicator"
                              style={{ backgroundColor: getStatusColor(ping.statusCode) }}
                            >
                              {getStatusIcon(ping.statusCode)}
                            </span>
                          </div>
                          <div className="ping-timestamp">
                            {formatTimestamp(ping.timestamp)}
                          </div>
                          <div className="ping-code">
                            <span 
                              className="status-code"
                              style={{ color: getStatusColor(ping.statusCode) }}
                            >
                              {ping.statusCode}
                            </span>
                          </div>
                          <div className="ping-duration">
                            {formatDuration(ping.duration)}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PingHistoryModal;
