import { useState, useEffect, useCallback, useRef } from 'react';
import { websiteService } from '../services/websiteService';
import websocketService from '../services/websocketService';

export const useDashboard = () => {
  const [state, setState] = useState({
    websites: [],
    stats: null,
    loading: true,
    error: null,
    refreshing: false
  });

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Safe state update helper
  const safeSetState = useCallback((updates) => {
    if (mountedRef.current) {
      setState(prevState => ({
        ...prevState,
        ...updates
      }));
    }
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async (options = {}) => {
    const { forceRefresh = false, silent = false } = options;
    
    if (!silent) {
      setState(prevState => ({
        ...prevState,
        loading: !prevState.websites.length,
        refreshing: !!prevState.websites.length,
        error: null
      }));
    }

    try {
      const [websites, stats] = await Promise.all([
        websiteService.getWebsites({ forceRefresh }),
        websiteService.getDashboardStats({ forceRefresh })
      ]);

      safeSetState({
        websites,
        stats,
        loading: false,
        refreshing: false,
        error: null
      });

      return { websites, stats };
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      safeSetState({
        loading: false,
        refreshing: false,
        error: error.message || 'Failed to load dashboard data'
      });
      throw error;
    }
  }, [safeSetState]);

  // Refresh data (force refresh)
  const refreshData = useCallback(async (silent = false) => {
    return await loadDashboardData({ forceRefresh: true, silent });
  }, [loadDashboardData]);

  // Update a specific website in the local state
  const updateWebsite = useCallback((websiteId, updates) => {
    setState(prevState => ({
      ...prevState,
      websites: prevState.websites.map(website =>
        website._id === websiteId
          ? { ...website, ...updates }
          : website
      )
    }));

    // Invalidate cache to ensure fresh data on next load
    websiteService.invalidateCache(['websites', 'dashboard_stats']);
  }, []);

  // Remove a website from local state
  const removeWebsite = useCallback((websiteId) => {
    setState(prevState => ({
      ...prevState,
      websites: prevState.websites.filter(website => website._id !== websiteId)
    }));

    // Invalidate cache
    websiteService.invalidateCache(['websites', 'dashboard_stats', `website_${websiteId}`]);
  }, []);

  // Add a website to local state
  const addWebsite = useCallback((newWebsite) => {
    setState(prevState => ({
      ...prevState,
      websites: [...prevState.websites, newWebsite]
    }));

    // Invalidate cache
    websiteService.invalidateCache(['websites', 'dashboard_stats']);
  }, []);

  // Pause website
  const pauseWebsite = useCallback(async (websiteId) => {
    try {
      const result = await websiteService.pauseWebsite(websiteId);
      updateWebsite(websiteId, { status: 'paused' });
      return result;
    } catch (error) {
      throw error;
    }
  }, [updateWebsite]);

  // Resume website
  const resumeWebsite = useCallback(async (websiteId) => {
    try {
      const result = await websiteService.resumeWebsite(websiteId);
      updateWebsite(websiteId, { status: 'up' }); // Assume it goes back to 'up' status
      return result;
    } catch (error) {
      throw error;
    }
  }, [updateWebsite]);

  // Delete website
  const deleteWebsite = useCallback(async (websiteId) => {
    try {
      const result = await websiteService.deleteWebsite(websiteId);
      removeWebsite(websiteId);
      return result;
    } catch (error) {
      throw error;
    }
  }, [removeWebsite]);

  // Create website
  const createWebsite = useCallback(async (websiteData) => {
    try {
      const result = await websiteService.addWebsite(websiteData);
      if (result.success && result.data) {
        addWebsite(result.data.website);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }, [addWebsite]);

  // Get filtered websites
  const getFilteredWebsites = useCallback((filters = {}) => {
    const { status, search } = filters;
    
    let filtered = [...state.websites];

    if (status && status !== 'all') {
      filtered = filtered.filter(website => website.status === status);
    }

    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(website =>
        website.name.toLowerCase().includes(searchTerm) ||
        website.url.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, []);

  // Set up auto-refresh interval
  const setupAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        await refreshData(true); // Silent refresh
      } catch (error) {
        console.warn('Auto-refresh failed:', error.message);
      }
    }, 30000); // 30 seconds
  }, [refreshData]);

  // Clear auto-refresh interval
  const clearAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initial load and setup
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const initDashboard = async () => {
      try {
        // Load dashboard data
        await loadDashboardData();
      } catch (error) {
        if (mounted) {
          console.error('Dashboard initialization failed:', error);
        }
      }

      if (mounted) {
        setupAutoRefresh();
      }
    };

    initDashboard();

    // Setup WebSocket for real-time updates
    const handleWebsiteUpdate = (data) => {
      if (mounted && data && data.website) {
        setState(prevState => ({
          ...prevState,
          websites: prevState.websites.map(website =>
            website._id === data.website._id ? data.website : website
          )
        }));
      }
    };

    const handleStatsUpdate = (data) => {
      if (mounted && data) {
        setState(prevState => ({
          ...prevState,
          stats: data
        }));
      }
    };

    // Connect WebSocket and subscribe to updates
    websocketService.connect();
    websocketService.on('website-update', handleWebsiteUpdate);
    websocketService.on('stats-update', handleStatsUpdate);
    websocketService.subscribeToWebsiteUpdates();
    websocketService.subscribeToStats();

    return () => {
      mounted = false;
      mountedRef.current = false;
      clearAutoRefresh();
      
      // Cleanup WebSocket
      websocketService.off('website-update', handleWebsiteUpdate);
      websocketService.off('stats-update', handleStatsUpdate);
      websocketService.unsubscribeFromWebsiteUpdates();
      websocketService.unsubscribeFromStats();
      websocketService.disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearAutoRefresh();
    };
  }, [clearAutoRefresh]);

  // Return dashboard state and actions
  return {
    // Data
    websites: state.websites,
    stats: state.stats,
    
    // State
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    
    // Actions
    refreshData,
    loadDashboardData,
    
    // Website operations
    createWebsite,
    updateWebsite,
    deleteWebsite,
    pauseWebsite,
    resumeWebsite,
    
    // Utilities
    getFilteredWebsites,
    
    // Auto-refresh controls
    setupAutoRefresh,
    clearAutoRefresh,
    
    // Cache utilities
    clearCache: websiteService.clearCache.bind(websiteService),
    getCacheStats: websiteService.getCacheStats.bind(websiteService)
  };
};
