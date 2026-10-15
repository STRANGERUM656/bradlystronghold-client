import React, { useState, useEffect, useRef } from "react";
import { GAMES } from "../config";
import { getLobby, updateLobby, removeLobby } from "../store";

export default function LobbyRoom({ user, lobby: initialLobby, onLeave }) {
  const [lobby, setLobby] = useState(initialLobby);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const game = GAMES.find(g => g.id === lobby.gameId) || GAMES[0];
  const isHost = lobby.hostId === user.id;
  const me = lobby.players.find(p => p.id === user.id);
  const isReady = me?.ready || false;

  useEffect(() => {
    const iv = setInterval(() => {
      const updated = getLobby(lobby.id);
      if (updated) setLobby(updated);
      else onLeave();
    }, 1000);
    return () => clearInterval(iv);
  }, [lobby.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lobby.messages]);

  const save = (updated) => {
    updateLobby(lobby.id, updated);
    setLobby(updated);
  };

  const send = () => {
    if (!input.trim()) return;
    save({
      ...lobby,
      messages: [...lobby.messages, {
        type: "chat", sender: user.username, avatar: user.avatar || "👤",
        text: input.trim(), time: Date.now(),
      }],
    });
    setInput("");
  };

  const toggleReady = () => {
    save({
      ...lobby,
      players: lobby.players.map(p =>
        p.id === user.id ? { ...p, ready: !p.ready } : p
      ),
    });
  };

  const leave = () => {
    if (!confirm("Vuoi uscire dalla lobby?")) return;
    let updated = {
      ...lobby,
      players: lobby.players.filter(p => p.id !== user.id),
      messages: [...lobby.messages, {
        type: "sys", text: user.username + " è uscito", time: Date.now(),
      }],
    };

    if (isHost) {
      if (updated.players.length === 0) {
        removeLobby(lobby.id);
        onLeave();
        return;
      }
      updated.host = updated.players[0].username;
      updated.hostId = updated.players[0].id;
      updated.hostAvatar = updated.players[0].avatar;
      updated.players = updated.players.map(p => ({
        ...p,
        isHost: p.id === updated.hostId,
      }));
    }
    save(updated);
    onLeave();
  };

  const startGame = () => {
    if (!lobby.players.every(p => p.ready)) {
      alert("Tutti i giocatori devono essere pronti!");
      return;
    }
    save({
      ...lobby,
      status: "starting",
      messages: [...lobby.messages, {
        type: "sys", text: "🚀 Partita avviata! Apertura " + game.name + "...",
        time: Date.now(),
      }],
    });
    if (window.electronAPI) {
      window.electronAPI.launchGame({
        gamePath: game.path, playerName: user.username, host: lobby.host,
      }).catch(err => alert("Errore avvio gioco: " + err.message));
    } else {
      alert("Avvio simulato: " + game.name + "\n(Percorso: " + game.path + ")");
    }
  };

  const allReady = lobby.players.length >= 2 && lobby.players.every(p => p.ready);

  return (
    <div className="layout">
      <div className="topbar">
        <div className="topbar-left">
          <button className="btn-back" onClick={leave}>← Esci</button>
          <div className="lobby-title-bar">
            <span className="lobby-icon-bar">{game.icon}</span>
            <div>
              <h2>{lobby.name}</h2>
              <span className="lobby-subtitle">{game.name}</span>
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="user-avatar">{user.avatar || "👤"}</span>
            <span className="user-name">{user.username}</span>
          </div>
        </div>
      </div>

      <div className="room">
        <div className="room-players">
          <div className="room-players-header">
            <h3>👥 Giocatori</h3>
            <span className="players-count-badge">{lobby.players.length}/{lobby.maxPlayers}</span>
          </div>
          <div className="room-players-list">
            {lobby.players.map(p => (
              <div key={p.id} className={"player-card " + (p.ready ? "ready" : "")}>
                <div className="player-avatar-wrap">
                  <div className="player-avatar">{p.avatar || "👤"}</div>
                  {p.isHost && <div className="host-crown">👑</div>}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {p.username}
                    {p.id === user.id && <span className="you-badge">TU</span>}
                  </div>
                  <div className={"player-status " + (p.ready ? "ready" : "")}>
                    {p.ready ? "✓ Pronto" : "In attesa"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="room-main">
          <div className="room-chat">
            <div className="room-chat-header">
              <h3>💬 Chat della lobby</h3>
            </div>
            <div className="room-chat-messages">
              {lobby.messages.map((m, i) => (
                <div key={i} className={"chat-msg " + (m.type === "sys" ? "system" : "")}>
                  {m.type === "chat" && (
                    <>
                      <span className="chat-avatar">{m.avatar || "👤"}</span>
                      <span className="chat-sender">{m.sender}:</span>
                    </>
                  )}
                  <span className="chat-text">{m.text}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="room-chat-input">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Scrivi un messaggio..."
              />
              <button onClick={send}>Invia</button>
            </div>
          </div>

          <div className="room-actions">
            <button
              className={"btn-ready " + (isReady ? "active" : "")}
              onClick={toggleReady}
            >
              {isReady ? "✓ Pronto" : "Segna come pronto"}
            </button>

            {isHost && (
              <button
                className="btn-start-game"
                onClick={startGame}
                disabled={!allReady}
                title={!allReady ? "Tutti i giocatori devono essere pronti (min 2)" : ""}
              >
                🚀 Avvia {game.shortName}
              </button>
            )}

            <button className="btn-leave-room" onClick={leave}>
              Esci dalla lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}