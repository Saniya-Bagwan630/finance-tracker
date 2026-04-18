import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    setIsAuthenticated(!!token);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);

    setIsAuthenticated(true);

    if (data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  };

  const signup = async (userData) => {
    return authAPI.signup(userData);
  };

  const logout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
