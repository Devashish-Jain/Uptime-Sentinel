import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AddWebsiteForm.css';

const AddWebsiteForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Website name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Website name must be at least 3 characters';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Website URL is required';
    } else {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.url.trim())) {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required for notifications';
    } else {
      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        url: formData.url.trim(),
        email: formData.email.trim()
      });

      // Reset form on success
      setFormData({ name: '', url: '', email: '' });
      setErrors({});
      setIsExpanded(false);
    } catch (error) {
      // Error is handled by parent component
      console.error('Form submission error:', error);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Reset form when collapsing
      setFormData({ name: '', url: '', email: '' });
      setErrors({});
    }
  };

  return (
    <motion.div 
      className="add-website-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className={`form-toggle-button ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpanded}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="toggle-icon">
          <motion.span
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            +
          </motion.span>
        </span>
        <span className="toggle-text">
          {isExpanded ? 'Cancel' : 'Add New Website'}
        </span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.form
            className="add-website-form"
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="form-content">
              <div className="form-header">
                <h3>Add Website to Monitor</h3>
                <p>Enter your website details and email to start monitoring with automatic downtime alerts</p>
              </div>

              <div className="form-fields">
                <motion.div
                  className="field-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <label htmlFor="name" className="field-label">
                    Website Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., My Business Website"
                    className={`field-input ${errors.name ? 'error' : ''}`}
                    disabled={isLoading}
                  />
                  <AnimatePresence>
                    {errors.name && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {errors.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="field-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label htmlFor="url" className="field-label">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className={`field-input ${errors.url ? 'error' : ''}`}
                    disabled={isLoading}
                  />
                  <AnimatePresence>
                    {errors.url && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {errors.url}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="field-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label htmlFor="email" className="field-label">
                    Email for Notifications
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your-email@example.com"
                    className={`field-input ${errors.email ? 'error' : ''}`}
                    disabled={isLoading}
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {errors.email}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              <motion.div
                className="form-actions"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  type="button"
                  className="action-button secondary"
                  onClick={toggleExpanded}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-button primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      className="loading-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ⟳
                    </motion.div>
                  ) : (
                    <>
                      Add Website
                      <span className="button-arrow">→</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddWebsiteForm;
