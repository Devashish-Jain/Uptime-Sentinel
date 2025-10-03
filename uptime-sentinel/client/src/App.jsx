import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from './services/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useDashboard } from './hooks/useDashboard';

// Components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StatsBar from './components/StatsBar';
import AddWebsiteForm from './components/AddWebsiteForm';
import WebsiteCard from './components/WebsiteCard';
import LandingStats from './components/LandingStats';

// Styles
import './App.css';

// Child component that actually uses the dashboard hook
const DashboardInner = () => {
  const [isAddingWebsite, setIsAddingWebsite] = useState(false);

  // Only initialized when this component is rendered (i.e., when authenticated)
  const {
    websites,
    stats,
    loading,
    error,
    refreshing,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    pauseWebsite,
    resumeWebsite,
    refreshData
  } = useDashboard();

  const handleAddWebsite = async (websiteData) => {
    setIsAddingWebsite(true);
    try {
      const response = await createWebsite(websiteData);
      console.log('Website added successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Failed to add website:', error);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setIsAddingWebsite(false);
    }
  };

  const handleDeleteWebsite = async (websiteId) => {
    try {
      await deleteWebsite(websiteId);
    } catch (error) {
      console.error('Failed to delete website:', error);
      throw error;
    }
  };

  const handleWebsiteUpdate = (websiteId, updates) => {
    updateWebsite(websiteId, updates);
  };

  return (
    <>
      {/* Stats Section */}
      <StatsBar websites={websites} stats={stats} refreshing={refreshing} />

      {/* Dashboard Section */}
      <section id="dashboard" className="dashboard-section">
        <div className="dashboard-container">
          <motion.div
            className="dashboard-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Monitoring Dashboard</h2>
            <p>Manage and monitor your websites in real-time</p>
          </motion.div>

          {/* Add Website Form */}
          <AddWebsiteForm
            onSubmit={handleAddWebsite}
            isLoading={isAddingWebsite}
          />

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
                <button
                  className="error-dismiss"
                  onClick={() => refreshData()}
                  title="Retry loading data"
                >
                  ↻
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Website List */}
          <div className="website-list-section">
            {loading ? (
              <div className="loading-container">
                <motion.div
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⟳
                </motion.div>
                <p>Loading your websites...</p>
              </div>
            ) : websites.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="empty-icon">🌐</div>
                <h3>No Websites Yet</h3>
                <p>Add your first website to start monitoring its uptime and performance.</p>
              </motion.div>
            ) : (
              <motion.div
                className="website-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, staggerChildren: 0.1 }}
              >
                <AnimatePresence>
                  {websites.map((website) => (
                    <WebsiteCard
                      key={website._id}
                      website={website}
                      onDelete={handleDeleteWebsite}
                      onUpdate={handleWebsiteUpdate}
                      onPause={pauseWebsite}
                      onResume={resumeWebsite}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

// Dashboard component (authenticated users only)
const DashboardContent = () => {
  const { isAuthenticated } = useAuth();

  // Don't render (and thus don't initialize dashboard hook) if not authenticated
  if (!isAuthenticated) {
    console.log('[DashboardContent] Not authenticated, not rendering dashboard');
    return null;
  }

  return <DashboardInner />;
};

// Main app content component
const AppContent = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ⟳
          </motion.div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show public content when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app">
        <Header />
        
        <main className="main-content">
          {/* Hero Section */}
          <HeroSection />

          {/* Landing Stats Section */}
          <LandingStats />

          <section className="welcome-section">
            <div className="welcome-container">
              <motion.div
                className="welcome-content"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2>Welcome to Uptime Sentinel</h2>
                <p>Monitor your websites with confidence. Sign in to get started or create a new account to begin monitoring your first website.</p>
                <div className="welcome-features">
                  <div className="feature">
                    <span className="feature-icon">🔍</span>
                    <h3>Real-time Monitoring</h3>
                    <p>Get instant notifications when your website goes down</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">📊</span>
                    <h3>Detailed Analytics</h3>
                    <p>Track uptime statistics and performance metrics</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">⚡</span>
                    <h3>Fast & Reliable</h3>
                    <p>Powered for accurate website health checks</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-content">
              <div className="footer-brand">
                <span className="footer-icon">📡</span>
                <span className="footer-name">Uptime Sentinel</span>
              </div>
              <div className="footer-text">
                <p>&copy; 2024 Uptime Sentinel. Built with ❤️ for reliable monitoring.</p>
              </div>
            </div>
          </div>
        </footer>

        {/* Background Elements */}
        <div className="app-background">
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div
              key={i}
              className="bg-particle"
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeInOut",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show authenticated dashboard
  return (
    <div className="app">
        <Header />
        
        <main className="main-content">
          {/* Hero Section */}
          <HeroSection />

          {/* Dashboard Content */}
          <DashboardContent />
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-content">
              <div className="footer-brand">
                <span className="footer-icon">📡</span>
                <span className="footer-name">Uptime Sentinel</span>
              </div>
              <div className="footer-text">
                <p>&copy; 2024 Uptime Sentinel. Built with ❤️ for reliable monitoring.</p>
              </div>
            </div>
          </div>
        </footer>

        {/* Background Elements */}
        <div className="app-background">
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div
              key={i}
              className="bg-particle"
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeInOut",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
  );
};

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
