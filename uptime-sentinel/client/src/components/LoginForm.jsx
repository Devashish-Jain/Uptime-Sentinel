import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = ({ onSwitchToRegister, onClose, onPendingVerification }) => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[LoginForm] handleSubmit: started');
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('[LoginForm] handleSubmit: validation errors', errors);
      setFormErrors(errors);
      return;
    }

    console.log('[LoginForm] handleSubmit: calling login for', formData.email);
    const result = await login(formData.email, formData.password);
    console.log('[LoginForm] handleSubmit: login result', result);
    
    if (result.success) {
      console.log('[LoginForm] handleSubmit: login success, closing modal');
      onClose();
    } else if (result.emailVerificationRequired) {
      console.log('[LoginForm] handleSubmit: needs email verification, switching to verification');
      // Handle email verification required
      onPendingVerification(result.email || formData.email);
    } else {
      console.log('[LoginForm] handleSubmit: login failed', result.error);
    }
  };

  return (
    <motion.div
      className="auth-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="auth-form">
        <div className="auth-header">
          <motion.div
            className="auth-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            📡
          </motion.div>
          <h2>Welcome Back</h2>
          <p>Sign in to monitor your websites</p>
        </div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-fields">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${formErrors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
            />
            {formErrors.email && (
              <span className="field-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${formErrors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formErrors.password && (
              <span className="field-error">{formErrors.password}</span>
            )}
          </div>

          <motion.button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <motion.div
                className="loading-spinner-small"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⟳
              </motion.div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
