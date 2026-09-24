import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("erp_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("erp_token") || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data);
      setToken(data.token);
      localStorage.setItem("erp_user", JSON.stringify(data));
      localStorage.setItem("erp_token", data.token);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("erp_user");
    localStorage.removeItem("erp_token");
  };

  // Quick switch role utility for effortless presentation / interview testing
  const switchRole = async (targetRole) => {
    const roleCredentials = {
      "Admin": { email: "admin@erp.com", pass: "admin123" },
      "Operations User": { email: "ops@erp.com", pass: "ops123" },
      "Sales User": { email: "sales@erp.com", pass: "sales123" }
    };

    const creds = roleCredentials[targetRole];
    if (creds) {
      return await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
