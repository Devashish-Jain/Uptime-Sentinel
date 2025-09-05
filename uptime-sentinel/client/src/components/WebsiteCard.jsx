import { motion } from 'framer-motion';
import { useState } from 'react';
import PingHistoryModal from './PingHistoryModal';
import { apiService } from '../services/api';
import './WebsiteCard.css';

const WebsiteCard = ({ website, onDelete, onWebsiteUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPingHistory, setShowPingHistory] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'UP':
        return '#10b981';
      case 'DOWN':
        return '#ef4444';
      case 'PENDING':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UP':
        return '✅';
      case 'DOWN':
        return '❌';
      case 'PENDING':
        return '⏳';
      default:
        return '❓';
    }
  };

  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const formatLastChecked = (lastChecked) => {
    if (!lastChecked) return 'Never';
    
    const date = new Date(lastChecked);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(website._id);
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCardClick = (e) => {
    // Don't open modal if clicking on action buttons
    if (e.target.closest('.card-actions')) {
      return;
    }
    setShowPingHistory(true);
  };

  const handleTogglePause = async (e) => {
    e.stopPropagation(); // Prevent card click
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

  return (
    <>
      <motion.div
        className="website-card clickable"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        layout
        whileHover={{ scale: 1.02, y: -4 }}
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
      {/* Status indicator */}
      <div className="card-header">
        <motion.div
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(website.status) }}
          animate={{
            scale: website.status === 'PENDING' ? [1, 1.2, 1] : 1,
            opacity: website.status === 'PENDING' ? [0.7, 1, 0.7] : 1,
          }}
          transition={{
            duration: 2,
            repeat: website.status === 'PENDING' ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <span className="status-icon">{getStatusIcon(website.status)}</span>
        </motion.div>

        <div className="website-info">
          <h3 className="website-name">{website.name}</h3>
          <p className="website-url">{formatUrl(website.url)}</p>
        </div>

        <div className="card-actions">
          {/* Pause/Resume Button */}
          <motion.button
            className={`pause-button ${website.isTemporarilyStopped ? 'resumed' : 'paused'}`}
            onClick={handleTogglePause}
            disabled={isPausing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={website.isTemporarilyStopped ? 'Resume monitoring' : 'Pause monitoring'}
          >
            {isPausing ? '⏳' : (website.isTemporarilyStopped ? '▶️' : '⏸️')}
          </motion.button>
          
          {!showDeleteConfirm ? (
            <motion.button
              className="delete-button"
              onClick={handleDelete}
              disabled={isDeleting}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              🗑️
            </motion.button>
          ) : (
            <div className="delete-confirm">
              <motion.button
                className="confirm-delete"
                onClick={handleDelete}
                disabled={isDeleting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {isDeleting ? '⏳' : '✓'}
              </motion.button>
              <motion.button
                className="cancel-delete"
                onClick={cancelDelete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                ✕
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Status details */}
      <div className="card-body">
        <div className="status-details">
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className={`detail-value status-${website.status.toLowerCase()}`}>
              {website.status}
              {website.isTemporarilyStopped && (
                <span className="paused-badge">• PAUSED</span>
              )}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Last Checked</span>
            <span className="detail-value">
              {formatLastChecked(website.lastChecked)}
            </span>
          </div>

          {website.uptimePercentage !== undefined && (
            <div className="detail-item">
              <span className="detail-label">Uptime</span>
              <span className="detail-value">
                {website.uptimePercentage.toFixed(1)}%
              </span>
            </div>
          )}

          {website.averageResponseTime && (
            <div className="detail-item">
              <span className="detail-label">Avg Response</span>
              <span className="detail-value">
                {Math.round(website.averageResponseTime)}ms
              </span>
            </div>
          )}
        </div>

        {/* Click hint */}
        <div className="click-hint">
          <span className="hint-text">👆 Click to view detailed ping history</span>
        </div>

        {/* Mini chart visualization */}
        {website.recentPings && website.recentPings.length > 0 && (
          <div className="ping-chart">
            <div className="chart-label">Recent Pings</div>
            <div className="chart-bars">
              {website.recentPings.slice(-10).map((ping, index) => {
                const isUp = ping.statusCode >= 200 && ping.statusCode < 400;
                const height = Math.min(Math.max((ping.duration / 2000) * 100, 20), 100);
                
                return (
                  <motion.div
                    key={index}
                    className={`chart-bar ${isUp ? 'success' : 'error'}`}
                    style={{ height: `${height}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    title={`${ping.duration}ms - ${ping.statusCode}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Background glow effect */}
      <motion.div
        className="card-glow"
        style={{ backgroundColor: getStatusColor(website.status) }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      </motion.div>

      {/* Ping History Modal */}
      <PingHistoryModal
        website={website}
        isOpen={showPingHistory}
        onClose={() => setShowPingHistory(false)}
        onWebsiteUpdate={onWebsiteUpdate}
      />
    </>
  );
};

export default WebsiteCard;
