import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return { ...parsed, username: parsed.username || parsed.email?.split('@')[0] || 'user' };
    }
    return null;
  });
  const [usersDb, setUsersDb] = useState(() => {
    const storedUsers = localStorage.getItem('usersDb');
    if (storedUsers) {
      const parsed = JSON.parse(storedUsers);
      return parsed.map(u => ({ ...u, username: u.username || u.email?.split('@')[0] || 'user' }));
    }
    return [];
  });

  const login = (username, password) => {
    const foundUser = usersDb.find((u) => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return { success: true };
    }
    return { success: false, message: 'Noto`g`ri ma`lumotlar' };
  };

  const register = (name, username, password) => {
    if (usersDb.some((u) => u.username === username)) {
      return { success: false, message: 'Bu username band' };
    }
    const newUser = { id: Date.now().toString(), name, username, password };
    const updatedDb = [...usersDb, newUser];
    
    setUsersDb(updatedDb);
    localStorage.setItem('usersDb', JSON.stringify(updatedDb));
    
    // Auto login
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
