import { motion } from 'framer-motion';
import './Header.css';

const Header = () => {
  return (
    <motion.header 
      className="header"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="header-container">
        <div className="header-brand">
          <motion.div
            className="brand-icon"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            📡
          </motion.div>
          <div className="brand-text">
            <h1>Uptime Sentinel</h1>
            <p>Website Monitoring Dashboard</p>
          </div>
        </div>

        <nav className="header-nav">
          <motion.div
            className="nav-links"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a href="#dashboard" className="nav-link active">
              Dashboard
            </a>
            <a href="#health" className="nav-link">
              Health Check
            </a>
          </motion.div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
