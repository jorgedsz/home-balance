import { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hb_token'));

  const login = async (password) => {
    const { data } = await authAPI.login(password);
    localStorage.setItem('hb_token', data.token);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('hb_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthed: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
