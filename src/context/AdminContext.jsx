import { createContext, useContext, useState } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("ght_admin_key") || ""; } catch { return ""; }
  });

  function login(key) {
    localStorage.setItem("ght_admin_key", key);
    setApiKey(key);
  }

  function logout() {
    localStorage.removeItem("ght_admin_key");
    setApiKey("");
  }

  const headers = apiKey ? { "X-Admin-Key": apiKey, "Content-Type": "application/json" } : {};
  const isAuthenticated = Boolean(apiKey);

  return (
    <AdminContext.Provider value={{ apiKey, isAuthenticated, headers, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
