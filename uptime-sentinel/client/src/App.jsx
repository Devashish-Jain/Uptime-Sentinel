import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from './services/api';

// Components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StatsBar from './components/StatsBar';
import AddWebsiteForm from './components/AddWebsiteForm';
import WebsiteCard from './components/WebsiteCard';

// Styles
import './App.css';

function App() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingWebsite, setIsAddingWebsite] = useState(false);

  useEffect(() => {
    fetchWebsites();
    
    // Set up periodic refresh
    const interval = setInterval(fetchWebsites, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchWebsites = async () => {
    try {
      setError(null);
      const data = await apiService.getWebsites();
      setWebsites(data);
    } catch (error) {
      console.error('Failed to fetch websites:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (websiteData) => {
    setIsAddingWebsite(true);
    try {
      const response = await apiService.addWebsite(websiteData);
      await fetchWebsites(); // Refresh the list
      
      // Show success message (you could add a toast notification here)
      console.log('Website added successfully:', response.data);
    } catch (error) {
      console.error('Failed to add website:', error);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setIsAddingWebsite(false);
    }
  };

  const handleDeleteWebsite = async (websiteId) => {
    try {
      await apiService.deleteWebsite(websiteId);
      // Remove from local state immediately for better UX
      setWebsites(prev => prev.filter(site => site._id !== websiteId));
    } catch (error) {
      console.error('Failed to delete website:', error);
      // Refresh to restore state if deletion failed
      await fetchWebsites();
      throw error;
    }
  };

  const handleWebsiteUpdate = (updatedWebsite) => {
    // Update the specific website in the local state
    setWebsites(prev => prev.map(site => 
      site._id === updatedWebsite._id ? updatedWebsite : site
    ));
  };

  return (
    <div className="app">
        <Header />
        
        <main className="main-content">
          {/* Hero Section */}
          <HeroSection />

          {/* Stats Section */}
          <StatsBar websites={websites} />

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
                      onClick={() => setError(null)}
                    >
                      ✕
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
                          onWebsiteUpdate={handleWebsiteUpdate}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
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
    // </div>
  );
}

export default App;
