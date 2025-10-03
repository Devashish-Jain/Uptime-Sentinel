import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';
import './LandingStats.css';

const LandingStats = () => {
  const [stats, setStats] = useState({
    totalWebsitesMonitored: 1247,
    pingsToday: 48521,
    averageUptime: 99.8,
    averageResponseTime: 267
  });
  
  const [isRealTime, setIsRealTime] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for real-time stats (optional)
    if (websocketService.isConnected()) {
      setIsRealTime(true);
      
      websocketService.on('global-stats-update', (data) => {
        if (data) {
          setStats(prevStats => ({ ...prevStats, ...data }));
        }
      });

      // Subscribe to global stats if available
      websocketService.send('subscribe', { channel: 'global-stats' });
    }

    return () => {
      if (isRealTime) {
        websocketService.off('global-stats-update');
        websocketService.send('unsubscribe', { channel: 'global-stats' });
      }
    };
  }, [isRealTime]);

  const statItems = [
    {
      id: 'websites',
      label: 'Websites Monitored',
      value: stats.totalWebsitesMonitored,
      suffix: '',
      icon: '🌐',
      color: '#3b82f6',
      description: 'Across all users'
    },
    {
      id: 'pings', 
      label: 'Pings Today',
      value: stats.pingsToday,
      suffix: '',
      icon: '⚡',
      color: '#06b6d4',
      description: 'Health checks performed'
    },
    {
      id: 'uptime',
      label: 'Average Uptime',
      value: stats.averageUptime,
      suffix: '%',
      icon: '✅',
      color: '#10b981',
      decimals: 1,
      description: 'Platform reliability'
    },
    {
      id: 'response',
      label: 'Avg Response Time',
      value: stats.averageResponseTime,
      suffix: 'ms',
      icon: '⚡',
      color: '#8b5cf6',
      description: 'Monitoring speed'
    }
  ];

  return (
    <motion.section 
      className="landing-stats"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="landing-stats-container">
        <motion.div 
          className="stats-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Platform Overview</h2>
          <p>Real-time monitoring statistics from our global network</p>
          {isRealTime && (
            <div className="real-time-indicator">
              <motion.div 
                className="pulse-dot"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span>Live Data</span>
            </div>
          )}
        </motion.div>

        <div className="landing-stats-grid">
          {statItems.map((stat, index) => (
            <motion.div
              key={stat.id}
              className="landing-stat-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3 + index * 0.1,
                ease: "easeOut" 
              }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              <div className="stat-icon-wrapper">
                <motion.div
                  className="stat-icon"
                  style={{ 
                    backgroundColor: `${stat.color}20`,
                    color: stat.color
                  }}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {stat.icon}
                </motion.div>
              </div>

              <div className="stat-content">
                <div className="stat-number">
                  <CountUp
                    start={0}
                    end={isNaN(stat.value) || stat.value === null ? 0 : stat.value}
                    duration={2.5}
                    enableScrollSpy={true}
                    scrollSpyOnce={true}
                    decimals={stat.decimals || 0}
                    suffix={stat.suffix || ''}
                    preserveValue={true}
                    redraw={false}
                  />
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </div>

              <motion.div
                className="stat-background-glow"
                style={{ backgroundColor: stat.color }}
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5
                }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="stats-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p>Statistics updated in real-time • Join thousands of satisfied users</p>
        </motion.div>
      </div>

      {/* Background decorative elements */}
      <div className="stats-background">
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            className="bg-stat-particle"
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: statItems[i % statItems.length].color
            }}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default LandingStats;
