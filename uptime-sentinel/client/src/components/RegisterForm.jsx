import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const RegisterForm = ({ onSwitchToLogin, onClose, onPendingVerification }) => {
  const { signup, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[RegisterForm] handleSubmit: started');
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('[RegisterForm] handleSubmit: validation errors', errors);
      setFormErrors(errors);
      return;
    }

    const { confirmPassword, ...userData } = formData;
    console.log('[RegisterForm] handleSubmit: calling signup for', userData.email);
    const result = await signup(userData);
    console.log('[RegisterForm] handleSubmit: signup result', result);
    
    if (result.success) {
      console.log('[RegisterForm] handleSubmit: signup success, switching to verification');
      // Go to email verification
      onPendingVerification(userData.email);
    } else {
      console.log('[RegisterForm] handleSubmit: signup failed', result.error);
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
          <h2>Create Account</h2>
          <p>Join us to start monitoring your websites</p>
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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${formErrors.firstName ? 'error' : ''}`}
                placeholder="First name"
                autoComplete="given-name"
                disabled={loading}
              />
              {formErrors.firstName && (
                <span className="field-error">{formErrors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${formErrors.lastName ? 'error' : ''}`}
                placeholder="Last name"
                autoComplete="family-name"
                disabled={loading}
              />
              {formErrors.lastName && (
                <span className="field-error">{formErrors.lastName}</span>
              )}
            </div>
          </div>

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
                placeholder="Create a password"
                autoComplete="new-password"
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
            <div className="password-requirements">
              <small>Password must be at least 8 characters long</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <span className="field-error">{formErrors.confirmPassword}</span>
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
              'Create Account'
            )}
          </motion.button>
        </form>

        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;
