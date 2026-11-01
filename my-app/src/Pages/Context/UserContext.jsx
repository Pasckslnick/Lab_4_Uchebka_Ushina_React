import { createContext, useState, useEffect } from "react";
import { getCurrentUser, login as apiLogin } from "../../api/auth.js";

export const userContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && token) setUser(JSON.parse(savedUser));
  }, [token]);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await getCurrentUser(token);
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch {
      logout();
    }
  };

  return (
    <userContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </userContext.Provider>
  );
}
