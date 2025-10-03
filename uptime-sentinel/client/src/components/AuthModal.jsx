import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import EmailVerificationForm from './EmailVerificationForm';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [pendingVerification, setPendingVerification] = useState(null);
  const { clearError } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Only clear pendingVerification if switching to a different initial mode
      if (initialMode !== 'verify') {
        setPendingVerification(null);
      }
      clearError();
    }
  }, [isOpen, initialMode, clearError]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    clearError();
    setPendingVerification(null);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSwitchToLogin = () => {
    setMode('login');
    setPendingVerification(null);
    clearError();
  };

  const handleSwitchToRegister = () => {
    setMode('register');
    setPendingVerification(null);
    clearError();
  };

  const handlePendingVerification = (email) => {
    console.log('[AuthModal] handlePendingVerification: switching to verify mode for', email);
    setPendingVerification({ email });
    setMode('verify');
  };

  const handleVerificationComplete = () => {
    console.log('[AuthModal] handleVerificationComplete: closing modal');
    setPendingVerification(null);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="auth-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        className="auth-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-modal-close"
          onClick={handleClose}
          aria-label="Close authentication modal"
        >
          ✕
        </button>

        <div className="auth-modal-content">
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <LoginForm
                key="login"
                onSwitchToRegister={handleSwitchToRegister}
                onClose={handleClose}
                onPendingVerification={handlePendingVerification}
              />
            )}
            {mode === 'register' && (
              <RegisterForm
                key="register"
                onSwitchToLogin={handleSwitchToLogin}
                onClose={handleClose}
                onPendingVerification={handlePendingVerification}
              />
            )}
            {mode === 'verify' && pendingVerification && (
              <EmailVerificationForm
                key="verify"
                email={pendingVerification.email}
                onSwitchToLogin={handleSwitchToLogin}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;
