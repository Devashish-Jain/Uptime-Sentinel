import { motion } from 'framer-motion';
import './ProgressLoader.css';

const ProgressLoader = ({ 
  message = "Loading...", 
  size = "medium", 
  type = "spinner",
  progress = null,
  className = ""
}) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  if (type === 'progress' && progress !== null) {
    return (
      <div className={`progress-loader ${sizeClasses[size]} ${className}`}>
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="progress-text">
            {message} {Math.round(progress)}%
          </div>
        </div>
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={`dots-loader ${sizeClasses[size]} ${className}`}>
        <div className="dots-container">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="dot"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <div className="loader-message">{message}</div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={`pulse-loader ${sizeClasses[size]} ${className}`}>
        <div className="pulse-container">
          <motion.div
            className="pulse-circle"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="pulse-icon">📡</div>
          </motion.div>
          <motion.div
            className="pulse-ring"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </div>
        <div className="loader-message">{message}</div>
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`spinner-loader ${sizeClasses[size]} ${className}`}>
      <div className="spinner-container">
        <motion.div
          className="spinner"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ⟳
        </motion.div>
        <motion.div
          className="spinner-glow"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <div className="loader-message">{message}</div>
    </div>
  );
};

export default ProgressLoader;
