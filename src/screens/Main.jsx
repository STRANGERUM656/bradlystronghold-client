import React, { useState, useEffect } from "react";
import { getMatchmaker, getLobbyHandle, socket } from "../rivetClient";
import { GAMES, LANGUAGES, APP_VERSION } from "../config";
import LobbyRoom from "./LobbyRoom";
import { getSettings, saveSettings, updateUser } from "../store";

export default function Main({ user, onLogout }) {
  const [tab, setTab] = useState("lobbies");
  const [lobbies, setLobbies] = useState([]);
  const [current, setCurrent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Lobby form
  const [name, setName] = useState("");
  const [selectedGame, setSelectedGame] = useState(GAMES[0]?.id || "");
  const [maxP, setMaxP] = useState(4);
  const [pwd, setPwd] = useState("");

  // Amici
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [friendMsg, setFriendMsg] = useState("");
  const [friendMsgType, setFriendMsgType] = useState("info");

  // Impostazioni
  const [settings, setSettings] = useState({ language: "it" });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ==================== SOCKET LISTENERS ====================
  useEffect(() => {
    if (!socket) return;

    const refreshFriends = () => {
      socket.emit("getFriends", (res) => {
        if (res.friends) setFriends(res.friends);
      });
      socket.emit("getPendingRequests", (res) => {
        if (res.requests) setPendingRequests(res.requests);
      });
    };

    const refreshOnline = () => {
      socket.emit("getOnlineUsers", (res) => {
        if (res.users) setOnlineUsers(res.users);
      });
    };

    const handleFriendsUpdated = () => { refreshFriends(); refreshOnline(); };
    const handleOnlineUsers = () => { refreshOnline(); refreshFriends(); };
    const handleRequest = (data) => {
      showToast("📩 Nuova richiesta amicizia da " + data.from, "info");
      refreshFriends();
    };
    const handleAccepted = (data) => {
      showToast("✓ " + data.by + " ha accettato la tua richiesta!", "success");
      refreshFriends();
    };
    const handleInvite = (data) => {
      showToast("🎮 " + data.from + " ti ha invitato in " + data.lobbyName, "info");
    };

    socket.on("friendsUpdated", handleFriendsUpdated);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("friendRequest", handleRequest);
    socket.on("friendAccepted", handleAccepted);
    socket.on("lobbyInvite", handleInvite);

    refreshFriends();
    refreshOnline();

    const iv = setInterval(() => {
      refreshFriends();
      refreshOnline();
    }, 5000);

    return () => {
      socket.off("friendsUpdated", handleFriendsUpdated);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("friendRequest", handleRequest);
      socket.off("friendAccepted", handleAccepted);
      socket.off("lobbyInvite", handleInvite);
      clearInterval(iv);
    };
  }, []);

  // ==================== LOBBY ====================
  useEffect(() => {
    const mm = getMatchmaker();
    const refresh = () => mm.getLobbies().then((l) => setLobbies(l || [])).catch(() => {});
    refresh();
    const iv = setInterval(refresh, 2000);
    return () => clearInterval(iv);
  }, []);

  const createLobby = async () => {
    if (!name.trim()) { showToast("Inserisci un nome", "error"); return; }
    const game = GAMES.find(g => g.id === selectedGame);
    if (!game) { showToast("Seleziona un gioco", "error"); return; }
    
    try {
      const mm = getMatchmaker();
      await mm.registerLobby({
        name: name.trim(), maxPlayers: parseInt(maxP),
        password: pwd || null,
        gameId: game.id, gameName: game.name, gameIcon: game.icon,
      });
      
      const lobbyId = await new Promise((resolve) => {
        const check = setInterval(() => {
          getMatchmaker().getLobbies().then(list => {
            const mine = list.find(l => l.host === user.username && l.name === name.trim());
            if (mine) { clearInterval(check); resolve(mine.id); }
          });
        }, 200);
      });
      
      setShowModal(false); setName(""); setPwd("");
      const handle = getLobbyHandle(lobbyId);
      const state = await handle.getState();
      setCurrent({ ...state, id: lobbyId });
    } catch (err) {
      showToast("Errore: " + err.message, "error");
    }
  };

  const joinLobby = async (lobby) => {
    let pass = null;
    if (lobby.hasPassword) {
      pass = prompt("Password della lobby:");
      if (pass === null) return;
    }
    try {
      const handle = getLobbyHandle(lobby.id);
      const state = await handle.join({ userId: user.id, username: user.username, password: pass });
      setCurrent({ ...lobby, ...state });
    } catch (err) {
      showToast("Errore: " + err.message, "error");
    }
  };

  // ==================== AMICI ====================
  const sendFriendRequest = () => {
    if (!newFriend.trim()) return;
    socket.emit("sendFriendRequest", { toUsername: newFriend.trim() }, (res) => {
      if (res.error) {
        setFriendMsg(res.error);
        setFriendMsgType("error");
      } else {
        setFriendMsg("Richiesta inviata!");
        setFriendMsgType("success");
        setNewFriend("");
      }
      setTimeout(() => setFriendMsg(""), 3000);
    });
  };

  const acceptRequest = (fromUsername) => {
    socket.emit("acceptFriend", { fromUsername }, (res) => {
      if (res.error) showToast(res.error, "error");
      else {
        showToast("✓ Amicizia con " + fromUsername + " confermata!", "success");
        setPendingRequests(prev => prev.filter(r => r.from !== fromUsername));
      }
    });
  };

  const declineRequest = (fromUsername) => {
    socket.emit("declineFriend", { fromUsername }, () => {
      setPendingRequests(prev => prev.filter(r => r.from !== fromUsername));
    });
  };

  const removeFriend = (friendUsername) => {
    if (!confirm("Rimuovere " + friendUsername + "?")) return;
    socket.emit("removeFriend", { friendUsername }, () => {
      showToast("Amico rimosso", "info");
    });
  };

  const inviteFriend = (friendUsername, lobbyId) => {
    socket.emit("inviteFriend", { friendUsername, lobbyId }, (res) => {
      if (res.error) showToast(res.error, "error");
      else showToast("Invito inviato a " + friendUsername, "success");
    });
  };

  // ==================== IMPOSTAZIONI ====================
  useEffect(() => {
    const s = getSettings();
    if (s.language) setSettings(prev => ({ ...prev, ...s }));
  }, []);

  const changeLanguage = (lang) => {
    saveSettings({ language: lang });
    setSettings(prev => ({ ...prev, language: lang }));
    showToast("Lingua cambiata", "success");
  };

  const t = LANGUAGES[settings.language]?.strings || LANGUAGES.it.strings;

  // ==================== RENDER ====================
  if (current) {
    return <LobbyRoom user={user} lobby={current} onLeave={() => setCurrent(null)} />;
  }

  return (
    <div className="layout">
      {toast && (
        <div className={"toast toast-" + toast.type}>
          <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "⚠" : "ℹ"}</span>
          {toast.msg}
        </div>
      )}

      <div className="topbar">
        <div className="logo">🏰 <span>BradlyStronghold</span></div>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="user-avatar">{user.avatar || "👤"}</span>
            <span className="user-name">{user.username}</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>⏻</button>
        </div>
      </div>

      <div className="main">
        <div className="sidebar">
          <div className={"nav-item " + (tab === "lobbies" ? "active" : "")} onClick={() => setTab("lobbies")}>
            <span className="nav-icon">🎮</span>
            <span className="nav-label">{t.lobby}</span>
          </div>
          <div className={"nav-item " + (tab === "friends" ? "active" : "")} onClick={() => setTab("friends")}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">{t.friends}</span>
            {pendingRequests.length > 0 && <span className="nav-badge" style={{background:"#ef4444"}}>{pendingRequests.length}</span>}
          </div>
          <div className={"nav-item " + (tab === "settings" ? "active" : "")} onClick={() => setTab("settings")}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">{t.settings}</span>
          </div>
          <div className="sidebar-footer">
            <div className="version-info">v{APP_VERSION}</div>
          </div>
        </div>

        <div className="content">

          {/* ===== LOBBY ===== */}
          {tab === "lobbies" && (
            <>
              <div className="content-header">
                <div>
                  <h2>🎮 Lobby disponibili</h2>
                  <p className="subtitle">{lobbies.length} lobby attive</p>
                </div>
                <button className="btn-new" onClick={() => setShowModal(true)}>+ {t.createLobby}</button>
              </div>

              <div className="lobbies-grid">
                {lobbies.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎮</div>
                    <h3>Nessuna lobby</h3>
                    <p>Crea la prima lobby!</p>
                  </div>
                ) : lobbies.map(l => (
                  <div key={l.id} className="lobby-card">
                    <div className="lobby-card-header">
                      <div className="lobby-icon">{l.gameIcon || "🎮"}</div>
                      <div className="lobby-title">
                        <h3>{l.name}</h3>
                        <span className="lobby-game">{l.gameName}</span>
                      </div>
                      {l.hasPassword && <span className="lock-icon">🔒</span>}
                    </div>
                    <div className="lobby-card-body">
                      <div className="lobby-host">
                        <span className="host-avatar">👤</span>
                        <div>
                          <div className="host-label">Host</div>
                          <div className="host-name">{l.host}</div>
                        </div>
                      </div>
                      <div className="lobby-players-count">
                        <span className="players-icon">👥</span>
                        <span className="players-count">{l.players.length}/{l.maxPlayers}</span>
                      </div>
                    </div>
                    <button className="btn-join" onClick={() => joinLobby(l)} disabled={l.players.length >= l.maxPlayers}>
                      {l.players.length >= l.maxPlayers ? "Piena" : t.join}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===== AMICI ===== */}
          {tab === "friends" && (
            <div className="section-view">
              <div className="content-header">
                <div>
                  <h2>👥 Amici</h2>
                  <p className="subtitle">{friends.length} amici · {onlineUsers.length} utenti online</p>
                </div>
              </div>

              {/* Richieste pendenti */}
              {pendingRequests.length > 0 && (
                <div className="add-friend-card" style={{borderColor:"#f59e0b"}}>
                  <div className="add-friend-header">
                    <span className="add-icon">📩</span>
                    <h3>Richieste di amicizia ({pendingRequests.length})</h3>
                  </div>
                  {pendingRequests.map(req => (
                    <div key={req.from} className="friend-card" style={{marginBottom:10}}>
                      <div className="friend-avatar-wrapper">
                        <div className="friend-avatar-big">{req.avatar}</div>
                      </div>
                      <div className="friend-info">
                        <div className="friend-name">{req.from}</div>
                        <div className="friend-status-text">Vuole essere tuo amico</div>
                      </div>
                      <button 
                        className="btn-primary" 
                        style={{padding:"8px 14px", fontSize:13, marginRight:5}}
                        onClick={() => acceptRequest(req.from)}
                      >✓ Accetta</button>
                      <button 
                        className="btn-remove-friend"
                        onClick={() => declineRequest(req.from)}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Aggiungi amico */}
              <div className="add-friend-card">
                <div className="add-friend-header">
                  <span className="add-icon">➕</span>
                  <h3>Aggiungi un amico</h3>
                </div>
                <div className="add-friend-row">
                  <input
                    placeholder="Username dell'amico..."
                    value={newFriend}
                    onChange={(e) => setNewFriend(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendFriendRequest()}
                  />
                  <button onClick={sendFriendRequest}>Invia richiesta</button>
                </div>
                {friendMsg && (
                  <div className={"friend-feedback " + friendMsgType} style={{marginTop:10}}>
                    {friendMsg}
                  </div>
                )}
              </div>

              {/* Lista amici */}
              <h3 style={{color:"#4ade80", marginBottom:15, marginTop:20, fontSize:14, textTransform:"uppercase", letterSpacing:1}}>
                I tuoi amici ({friends.length})
              </h3>
              <div className="friends-grid">
                {friends.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Nessun amico</h3>
                    <p>Invia una richiesta di amicizia per iniziare!</p>
                  </div>
                ) : friends.map(f => (
                  <div key={f.username} className="friend-card">
                    <div className="friend-avatar-wrapper">
                      <div className="friend-avatar-big">{f.avatar}</div>
                      <div className={"friend-status-dot " + (f.online ? "online" : "offline")}></div>
                    </div>
                    <div className="friend-info">
                      <div className="friend-name">{f.username}</div>
                      <div className="friend-status-text" style={{color: f.online ? "#4ade80" : "#666"}}>
                        {f.online ? "🟢 Online" : "⚫ Offline"}
                      </div>
                    </div>
                    <button 
                      className="btn-remove-friend"
                      onClick={() => removeFriend(f.username)}
                      title="Rimuovi"
                    >✕</button>
                  </div>
                ))}
              </div>

              {/* Utenti online */}
              <h3 style={{color:"#4ade80", marginBottom:15, marginTop:30, fontSize:14, textTransform:"uppercase", letterSpacing:1}}>
                Utenti online ({onlineUsers.length})
              </h3>
              <div className="friends-grid">
                {onlineUsers.length === 0 ? (
                  <p style={{color:"#666", fontStyle:"italic"}}>Nessun altro utente online</p>
                ) : onlineUsers.map(u => (
                  <div key={u.username} className="friend-card" style={{opacity: u.isFriend ? 0.6 : 1}}>
                    <div className="friend-avatar-wrapper">
                      <div className="friend-avatar-big">{u.avatar}</div>
                      <div className="friend-status-dot online"></div>
                    </div>
                    <div className="friend-info">
                      <div className="friend-name">{u.username}</div>
                      <div className="friend-status-text">{u.isFriend ? "✓ Già amico" : "Disponibile"}</div>
                    </div>
                    {!u.isFriend && (
                      <button 
                        className="btn-primary" 
                        style={{padding:"8px 14px", fontSize:12}}
                        onClick={() => {
                          setNewFriend(u.username);
                          socket.emit("sendFriendRequest", { toUsername: u.username }, (res) => {
                            if (res.error) showToast(res.error, "error");
                            else showToast("Richiesta inviata a " + u.username, "success");
                          });
                        }}
                      >+ Aggiungi</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== IMPOSTAZIONI ===== */}
          {tab === "settings" && (
            <div className="section-view">
              <div className="content-header">
                <div>
                  <h2>⚙️ Impostazioni</h2>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-icon">👤</span>
                  <h3>Profilo</h3>
                </div>
                <div className="settings-row">
                  <label>Username</label>
                  <code>{user.username}</code>
                </div>
                <div className="settings-row">
                  <label>ID Utente</label>
                  <code>{user.id}</code>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-icon">🌐</span>
                  <h3>Lingua</h3>
                </div>
                <div className="language-grid">
                  {Object.entries(LANGUAGES).map(([code, lang]) => (
                    <button
                      key={code}
                      className={"lang-option " + (settings.language === code ? "active" : "")}
                      onClick={() => changeLanguage(code)}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-name">{lang.name}</span>
                      {settings.language === code && <span className="lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-icon">📡</span>
                  <h3>Connessione</h3>
                </div>
                <div className="connection-status">
                  <div className={"conn-indicator " + (socket?.connected ? "online" : "")}></div>
                  <div className="conn-info">
                    <div className="conn-label">Stato</div>
                    <div className="conn-value">{socket?.connected ? "Online" : "Offline"}</div>
                  </div>
                </div>
                <div className="settings-row">
                  <label>Amici</label>
                  <code>{friends.length}</code>
                </div>
                <div className="settings-row">
                  <label>Utenti online</label>
                  <code>{onlineUsers.length}</code>
                </div>
                <div className="settings-row">
                  <label>Lobby attive</label>
                  <code>{lobbies.length}</code>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-icon">ℹ️</span>
                  <h3>Informazioni</h3>
                </div>
                <div className="settings-row"><label>App</label><code>BradlyStronghold</code></div>
                <div className="settings-row"><label>Versione</label><code>{APP_VERSION}</code></div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎮 Crea Nuova Lobby</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Gioco</label>
                <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
                  {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Nome lobby</label>
                <input placeholder="Es. Partita di stasera" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="input-group">
                <label>Max giocatori</label>
                <select value={maxP} onChange={(e) => setMaxP(e.target.value)}>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </div>
              <div className="input-group">
                <label>Password (opzionale)</label>
                <input type="password" placeholder="Lascia vuoto per lobby pubblica" value={pwd} onChange={(e) => setPwd(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn-primary" onClick={createLobby}>Crea</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}