import { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    console.log('[Auth] useEffect: checking auth status on mount');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('[Auth] checkAuthStatus: start');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const response = await apiService.checkAuthStatus();
      console.log('[Auth] checkAuthStatus: response', response);
      
      if (response.success && response.isAuthenticated) {
        console.log('[Auth] checkAuthStatus: authenticated as', response.user?.email);
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      } else {
        console.log('[Auth] checkAuthStatus: not authenticated');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('[Auth] checkAuthStatus: failed', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const signup = async (userData) => {
    try {
      console.log('[Auth] signup: submitting', userData.email);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await apiService.signup(userData);
      console.log('[Auth] signup: response', response);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('[Auth] signup: failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('[Auth] login: submitting', email);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await apiService.login(email, password);
      console.log('[Auth] login: response', response);
      
      if (response.success) {
        console.log('[Auth] login: success, user', response.data.user?.email);
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data.user });
        return {
          success: true,
          user: response.data.user
        };
      } else {
        const errorMessage = response.message || 'Login failed';
        console.warn('[Auth] login: requires verification?', response.emailVerificationRequired, 'email:', response.email);
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return {
          success: false,
          error: errorMessage,
          emailVerificationRequired: response.emailVerificationRequired,
          email: response.email
        };
      }
    } catch (error) {
      console.error('[Auth] login: failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
        emailVerificationRequired: error.response?.data?.emailVerificationRequired,
        email: error.response?.data?.email
      };
    }
  };

  const verifyEmail = async (email, verificationCode) => {
    try {
      console.log('[Auth] verifyEmail: submitting code for', email, 'code:', verificationCode);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await apiService.verifyEmail(email, verificationCode);
      console.log('[Auth] verifyEmail: response', response);
      
      if (response.success) {
        console.log('[Auth] verifyEmail: success, user', response.data.user?.email);
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data.user });
        return {
          success: true,
          user: response.data.user
        };
      } else {
        const errorMessage = response.message || 'Email verification failed';
        console.warn('[Auth] verifyEmail: failed', errorMessage);
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('[Auth] verifyEmail: failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'Email verification failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await apiService.resendVerificationEmail(email);
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Resend verification email failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send verification email';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  };

  const contextValue = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    signup,
    login,
    verifyEmail,
    resendVerificationEmail,
    logout,
    clearError,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
