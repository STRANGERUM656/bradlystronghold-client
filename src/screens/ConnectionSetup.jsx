import React, { useState } from "react";
import { setServerUrl, clearServerUrl } from "../config";

export default function ConnectionSetup({ onConnected }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connect = () => {
    setError("");
    let finalUrl = url.trim();
    if (!finalUrl) { setError("Inserisci l'indirizzo del server"); return; }
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "http://" + finalUrl;
    }
    if (!finalUrl.includes(":")) {
      finalUrl += ":3000";
    }

    setLoading(true);
    setServerUrl(finalUrl);

    // Test connessione
    fetch(finalUrl + "/status")
      .then(res => res.json())
      .then(data => {
        console.log("Server risponde:", data);
        onConnected();
      })
      .catch(err => {
        setLoading(false);
        clearServerUrl();
        setError("Impossibile connettersi a " + finalUrl + ". Verifica che il server sia attivo.");
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
          <div className="auth-logo">🔌</div>
          <h1>Configura Server</h1>
          <p>Inserisci l'indirizzo del server a cui connetterti</p>
        </div>

        {error && <div className="auth-error"><span>⚠️</span> {error}</div>}

        <div className="auth-form">
          <div className="input-group">
            <label>Indirizzo del server</label>
            <input
              type="text"
              placeholder="Es. 26.150.162.84:3000"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && connect()}
              autoFocus
            />
            <p style={{ fontSize: 11, color: "#8899aa", marginTop: 6 }}>
              Chiedi al tuo amico che ospita il server il suo <b>IP Radmin</b> (inizia per 26.)
            </p>
          </div>

          <button className="btn-primary" onClick={connect} disabled={loading}>
            {loading ? "Connessione..." : "Connetti"}
          </button>
        </div>

        <div className="auth-footer" style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>
          <p><b>Come funziona:</b></p>
          <p>1. Uno di voi (host) avvia il server sul suo PC</p>
          <p>2. L'host comunica il suo IP Radmin (es. 26.x.x.x)</p>
          <p>3. Gli altri inseriscono quell'IP qui sopra</p>
        </div>
      </div>
    </div>
  );
}