import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './HeroSection.css';

const HeroSection = ({ stats = null }) => {
  const { isAuthenticated } = useAuth();

  // Show minimal hero for authenticated users
  if (isAuthenticated) {
    return (
      <section className="hero-section authenticated">
        <div className="hero-content">
          <motion.div
            className="hero-text minimal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>Dashboard Overview</h1>
            <p>Monitor and manage your websites in real-time</p>
          </motion.div>
        </div>
      </section>
    );
  }

  // Show full hero for unauthenticated users
  return (
    <section className="hero-section">
      {/* Background gradient */}
      <div className="hero-gradient-overlay" />
      
      {/* Main content */}
      <div className="hero-content">
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1>Monitor Your Digital Presence</h1>
          <p>
            Keep track of your websites' uptime and performance with real-time monitoring,
            detailed analytics, and intelligent alerts powered by advanced web scraping technology.
          </p>
        </motion.div>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Monitoring Accuracy</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-number">&lt;30s</div>
            <div className="stat-label">Response Time</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Continuous Monitoring</div>
          </div>
        </motion.div>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <button
            className="cta-button"
            onClick={() => {
              document.getElementById('dashboard')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
          >
            Start Monitoring
            <span className="cta-arrow">→</span>
          </button>
        </motion.div>
      </div>
      
      {/* Animated background elements */}
      <div className="hero-bg-elements">
        {Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={i}
            className="floating-element"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
          >
            {['📊', '⚡', '🔍', '📈', '🛡️', '⏰'][i]}
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="scroll-arrow"
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ↓
        </motion.div>
        <span>Scroll to Dashboard</span>
      </motion.div>
    </section>
  );
};

export default HeroSection;
