import React, { useState } from "react";
import { socket } from "../rivetClient";

export default function Login({ onLogin, onGoRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = () => {
    setErr("");
    if (!u.trim() || !p.trim()) { setErr("Compila tutti i campi"); return; }
    setLoading(true);
    socket.emit("login", { username: u.trim(), password: p }, (res) => {
      setLoading(false);
      if (res.error) setErr(res.error);
      else onLogin(res.user);
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-decoration">
        <div className="auth-blob blob-1"></div>
        <div className="auth-blob blob-2"></div>
        <div className="auth-blob blob-3"></div>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🏰</div>
          <h1>BradlyStronghold</h1>
          <p>La tua lobby per Stronghold Crusader</p>
        </div>
        {err && <div className="auth-error"><span>⚠️</span> {err}</div>}
        <div className="auth-form">
          <div className="input-group">
            <label>Username</label>
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Inserisci username" autoFocus />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Inserisci password" onKeyDown={(e) => e.key === "Enter" && go()} />
          </div>
          <button className="btn-primary" onClick={go} disabled={loading}>{loading ? "Accesso..." : "Accedi"}</button>
        </div>
        <div className="auth-footer">
          <span>Non hai un account?</span>
          <button className="btn-link" onClick={onGoRegister}>Registrati</button>
        </div>
      </div>
    </div>
  );
}