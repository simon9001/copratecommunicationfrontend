import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kenha_token'));
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('kenha_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const login = (authToken, userData) => {
    localStorage.setItem('kenha_token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('kenha_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
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
