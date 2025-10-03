import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './Header.css';
import './Auth.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLoginClick = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

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
            {isAuthenticated && (
              <>
                <a href="#dashboard" className="nav-link active">
                  Dashboard
                </a>
              </>
            )}
          </motion.div>

          <motion.div
            className="header-auth"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {isAuthenticated ? (
              <div className="user-menu">
                <button
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="user-avatar">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                  <span className="user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="user-menu-arrow">
                    {userMenuOpen ? '▲' : '▼'}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="user-dropdown"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="user-dropdown-header">
                        <div className="user-info">
                          <div className="user-name">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</div>
                          <div className="user-email">{user?.email}</div>
                        </div>
                      </div>
                      <div className="user-dropdown-menu">
                        <button className="dropdown-item">
                          <span>👤</span> Profile
                        </button>
                        <button className="dropdown-item">
                          <span>⚙️</span> Settings
                        </button>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item logout" onClick={handleLogout}>
                          <span>🚪</span> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="auth-btn login-btn" onClick={handleLoginClick}>
                  Sign In
                </button>
                <button className="auth-btn register-btn" onClick={handleRegisterClick}>
                  Sign Up
                </button>
              </div>
            )}
          </motion.div>
        </nav>
      </div>

      <AnimatePresence>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialMode={authMode}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
