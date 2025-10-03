import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useMemo } from 'react';
import './StatsBar.css';

const StatsBar = ({ websites = [], stats: providedStats, refreshing = false }) => {
  // Use provided stats if available, otherwise calculate from websites
  const stats = useMemo(() => {
    if (providedStats) {
      return {
        totalWebsites: providedStats.totalWebsites || 0,
        totalPingsToday: providedStats.totalPingsToday || 0,
        averageUptime: Math.round((providedStats.averageUptime || 0) * 10) / 10,
        averageResponseTime: Math.round(providedStats.averageResponseTime || 0)
      };
    }

    // Fallback calculation if no stats provided
    if (!websites || websites.length === 0) {
      return {
        totalWebsites: 0,
        totalPingsToday: 0,
        averageUptime: 0,
        averageResponseTime: 0
      };
    }

    const totalWebsites = websites.length;
    
    // Calculate total pings today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const totalPingsToday = websites.filter(website => 
      website.lastChecked && new Date(website.lastChecked) >= todayStart
    ).length;

    // Calculate average uptime percentage
    const validUptimes = websites.filter(w => w.totalChecks > 0);
    const averageUptime = validUptimes.length > 0 
      ? validUptimes.reduce((sum, website) => {
          const uptime = ((website.totalChecks - website.totalFailures) / website.totalChecks) * 100;
          return sum + uptime;
        }, 0) / validUptimes.length
      : 0;

    // Calculate average response time
    const validResponseTimes = websites.filter(w => w.averageResponseTime > 0);
    const averageResponseTime = validResponseTimes.length > 0 
      ? validResponseTimes.reduce((sum, website) => sum + website.averageResponseTime, 0) / validResponseTimes.length
      : 0;

    return {
      totalWebsites,
      totalPingsToday,
      averageUptime: Math.round(averageUptime * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime)
    };
  }, [websites, providedStats]);

  const statItems = [
    {
      id: 'websites',
      label: 'Websites Monitored',
      value: stats.totalWebsites,
      suffix: '',
      icon: '🌐',
      color: '#3b82f6'
    },
    {
      id: 'pings',
      label: 'Pings Today',
      value: stats.totalPingsToday,
      suffix: '',
      icon: '⚡',
      color: '#06b6d4'
    },
    {
      id: 'uptime',
      label: 'Average Uptime',
      value: stats.averageUptime,
      suffix: '%',
      icon: '✅',
      color: '#10b981',
      decimals: 1
    },
    {
      id: 'response',
      label: 'Avg Response Time',
      value: stats.averageResponseTime,
      suffix: 'ms',
      icon: '⚡',
      color: '#8b5cf6'
    }
  ];

  return (
    <motion.section 
      className={`stats-bar ${refreshing ? 'refreshing' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="stats-container">
        {refreshing && (
          <div className="refresh-indicator">
            <motion.div
              className="refresh-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ↻
            </motion.div>
          </div>
        )}
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.id}
            className="stat-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut" 
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
          >
            <div className="stat-icon-container">
              <motion.div
                className="stat-icon"
                style={{ backgroundColor: `${stat.color}20` }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {stat.icon}
              </motion.div>
            </div>

            <div className="stat-content">
              <div className="stat-number">
                <CountUp
                  start={0}
                  end={isNaN(stat.value) || stat.value === null || stat.value === undefined ? 0 : stat.value}
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
            </div>

            <motion.div
              className="stat-glow"
              style={{ backgroundColor: stat.color }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Background decoration */}
      <div className="stats-bg-decoration">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="decoration-dot"
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default StatsBar;
