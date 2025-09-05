import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useEffect, useState } from 'react';
import './StatsBar.css';

const StatsBar = ({ websites = [] }) => {
  const [stats, setStats] = useState({
    totalWebsites: 0,
    totalPingsToday: 0,
    averageUptime: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    calculateStats();
  }, [websites]);

  const calculateStats = () => {
    if (!websites || websites.length === 0) {
      setStats({
        totalWebsites: 0,
        totalPingsToday: 0,
        averageUptime: 0,
        averageResponseTime: 0
      });
      return;
    }

    const totalWebsites = websites.length;
    
    // Calculate total pings today (mock data for demonstration)
    const totalPingsToday = websites.reduce((total, website) => {
      const today = new Date();
      const todayPings = website.pingHistory?.filter(ping => {
        const pingDate = new Date(ping.timestamp);
        return pingDate.toDateString() === today.toDateString();
      }) || [];
      return total + todayPings.length;
    }, 0);

    // Calculate average uptime percentage
    const uptimes = websites.map(website => website.uptimePercentage || 0);
    const averageUptime = uptimes.length > 0 
      ? uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length 
      : 0;

    // Calculate average response time
    const responseTimes = websites.map(website => website.averageResponseTime || 0);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    setStats({
      totalWebsites,
      totalPingsToday,
      averageUptime: Math.round(averageUptime * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime)
    });
  };

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
      className="stats-bar"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="stats-container">
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
                  end={stat.value || 0}
                  duration={2.5}
                  enableScrollSpy={true}
                  scrollSpyOnce={true}
                  decimals={stat.decimals || 0}
                  suffix={stat.suffix}
                  preserveValue={true}
                  redraw={true}
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
