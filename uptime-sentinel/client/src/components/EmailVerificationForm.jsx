import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationForm = ({ email, onSwitchToLogin, onVerificationComplete }) => {
  const { verifyEmail, resendVerificationEmail, loading, error } = useAuth();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    // Only allow alphanumeric characters and convert to uppercase
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanValue.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = cleanValue;
      setVerificationCode(newCode);

      // Auto-focus next input if value is entered
      if (cleanValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 characters are entered
      if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
        console.log('[EmailVerificationForm] handleInputChange: code complete, auto-submitting');
        handleAutoSubmit(newCode.join(''));
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && verificationCode.every(digit => digit !== '')) {
      // Submit on Enter if all fields are filled
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (pasteData.length >= 6) {
      const newCode = pasteData.slice(0, 6).split('');
      setVerificationCode(newCode);
      
      // Auto-submit after paste
      if (newCode.length === 6) {
        handleAutoSubmit(newCode.join(''));
      }
    }
  };

  const handleAutoSubmit = async (code) => {
    console.log('[EmailVerificationForm] handleAutoSubmit: auto-submitting code', code);
    if (code.length === 6) {
      const result = await verifyEmail(email, code);
      console.log('[EmailVerificationForm] handleAutoSubmit: verification result', result);
      if (result.success) {
        console.log('[EmailVerificationForm] handleAutoSubmit: success, completing');
        onVerificationComplete();
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('[EmailVerificationForm] handleSubmit: manual submit');
    
    const code = verificationCode.join('');
    console.log('[EmailVerificationForm] handleSubmit: submitting code', code);
    if (code.length === 6) {
      const result = await verifyEmail(email, code);
      console.log('[EmailVerificationForm] handleSubmit: verification result', result);
      if (result.success) {
        console.log('[EmailVerificationForm] handleSubmit: success, completing');
        onVerificationComplete();
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    
    const result = await resendVerificationEmail(email);
    
    if (result.success) {
      setResendMessage('Verification code sent successfully!');
    } else {
      setResendMessage('Failed to send verification code. Please try again.');
    }
    
    setIsResending(false);
    
    // Clear message after 5 seconds
    setTimeout(() => setResendMessage(''), 5000);
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
            📧
          </motion.div>
          <h2>Verify Your Email</h2>
          <p>
            We've sent a 6-digit verification code to<br />
            <strong>{email}</strong>
          </p>
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

        {resendMessage && (
          <motion.div
            className={`info-message ${resendMessage.includes('success') ? 'success' : 'error'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="info-icon">
              {resendMessage.includes('success') ? '✅' : '⚠️'}
            </span>
            <span className="info-text">{resendMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-fields">
          <div className="verification-code-container">
            <label>Enter Verification Code</label>
            <div className="verification-code-inputs">
              {verificationCode.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="verification-code-input"
                  disabled={loading}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>
            <p className="verification-help">
              Enter the 6-character code (letters and numbers)
            </p>
          </div>

          <motion.button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || verificationCode.some(digit => !digit)}
            whileHover={{ scale: (loading || verificationCode.some(digit => !digit)) ? 1 : 1.02 }}
            whileTap={{ scale: (loading || verificationCode.some(digit => !digit)) ? 1 : 0.98 }}
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
              'Verify Email'
            )}
          </motion.button>
        </form>

        <div className="auth-actions">
          <p>
            Didn't receive the code?{' '}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </p>
          
          <p>
            Want to use a different email?{' '}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailVerificationForm;
