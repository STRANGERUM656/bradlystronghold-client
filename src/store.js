const K = {
  CURRENT: "bs_current_user",
  SETTINGS: "bs_settings",
  LOBBIES: "bs_lobbies_cache",
};

// ===== UTENTE =====
export const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem(K.CURRENT) || "null"); } catch { return null; } };
export const setCurrentUser = (u) => { if (u) localStorage.setItem(K.CURRENT, JSON.stringify(u)); else localStorage.removeItem(K.CURRENT); };

// ===== IMPOSTAZIONI =====
export const getSettings = () => { try { return JSON.parse(localStorage.getItem(K.SETTINGS) || "{}"); } catch { return {}; } };
export const saveSettings = (s) => { const c = getSettings(); const m = { ...c, ...s }; localStorage.setItem(K.SETTINGS, JSON.stringify(m)); return m; };

// ===== LOBBY (cache locale per UI) =====
export const getLobbies = () => { try { return JSON.parse(localStorage.getItem(K.LOBBIES) || "[]"); } catch { return []; } };
export const saveLobbies = (lobbies) => localStorage.setItem(K.LOBBIES, JSON.stringify(lobbies));

export const getLobby = (lobbyId) => getLobbies().find(l => l.id === lobbyId);

export const updateLobby = (lobbyId, updates) => {
  const lobbies = getLobbies();
  const idx = lobbies.findIndex(l => l.id === lobbyId);
  if (idx < 0) return null;
  lobbies[idx] = { ...lobbies[idx], ...updates };
  saveLobbies(lobbies);
  return lobbies[idx];
};

export const removeLobby = (lobbyId) => {
  saveLobbies(getLobbies().filter(l => l.id !== lobbyId));
};

export const addLobby = (lobby) => {
  const lobbies = getLobbies();
  if (!lobbies.find(l => l.id === lobby.id)) {
    lobbies.push(lobby);
    saveLobbies(lobbies);
  }
  return lobby;
};