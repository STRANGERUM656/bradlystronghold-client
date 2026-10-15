import React, { useState, useEffect } from "react";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Main from "./screens/Main";
import ConnectionSetup from "./screens/ConnectionSetup";
import { getCurrentUser, setCurrentUser } from "./store";
import { connectSocket } from "./rivetClient";

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) { setUser(saved); setScreen("main"); }
    
    // Verifica se il server è già configurato
    const savedUrl = localStorage.getItem("bs_server_url");
    if (savedUrl) {
      // Testa connessione
      fetch(savedUrl + "/status")
        .then(() => {
          connectSocket();
          setConnected(true);
        })
        .catch(() => setConnected(false))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (u) => { setUser(u); setCurrentUser(u); setScreen("main"); };
  const logout = () => { setUser(null); setCurrentUser(null); setScreen("login"); };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner">🏰</div><h1>BradlyStronghold</h1><p>Caricamento...</p></div>;
  }

  if (!connected) {
    return <ConnectionSetup onConnected={() => {
      connectSocket();
      setConnected(true);
    }} />;
  }

  if (screen === "main" && user) return <Main user={user} onLogout={logout} />;
  if (screen === "register") return <Register onRegister={login} onBack={() => setScreen("login")} />;
  return <Login onLogin={login} onGoRegister={() => setScreen("register")} />;
}