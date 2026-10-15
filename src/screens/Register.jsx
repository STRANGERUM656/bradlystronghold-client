import React, { useState } from "react";
import { socket } from "../rivetClient";

export default function Register({ onRegister, onBack }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = () => {
    setErr("");
    if (!u.trim() || !p.trim()) { setErr("Compila tutti i campi"); return; }
    if (u.trim().length < 3) { setErr("Username min 3 caratteri"); return; }
    if (p.length < 4) { setErr("Password min 4 caratteri"); return; }
    if (p !== c) { setErr("Password non coincidono"); return; }
    setLoading(true);
    socket.emit("register", { username: u.trim(), password: p, avatar: "👤" }, (res) => {
      setLoading(false);
      if (res.error) setErr(res.error);
      else onRegister(res.user);
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
          <div className="auth-logo">🎮</div>
          <h1>Crea Account</h1>
          <p>Unisciti a BradlyStronghold</p>
        </div>
        {err && <div className="auth-error"><span>⚠️</span> {err}</div>}
        <div className="auth-form">
          <div className="input-group"><label>Username</label><input value={u} onChange={(e) => setU(e.target.value)} placeholder="Scegli username" autoFocus /></div>
          <div className="input-group"><label>Password</label><input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Minimo 4 caratteri" /></div>
          <div className="input-group"><label>Conferma</label><input type="password" value={c} onChange={(e) => setC(e.target.value)} placeholder="Ripeti password" onKeyDown={(e) => e.key === "Enter" && go()} /></div>
          <button className="btn-primary" onClick={go} disabled={loading}>{loading ? "Creazione..." : "Crea Account"}</button>
        </div>
        <div className="auth-footer">
          <span>Hai già un account?</span>
          <button className="btn-link" onClick={onBack}>Accedi</button>
        </div>
      </div>
    </div>
  );
}