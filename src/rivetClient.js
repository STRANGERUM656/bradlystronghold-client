import { io } from "socket.io-client";
import { getServerUrl } from "./config";

let socketInstance = null;

export function connectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  const url = getServerUrl();
  console.log("[Socket] Connessione a:", url);
  socketInstance = io(url, { 
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });
  return socketInstance;
}

export function getSocket() {
  if (!socketInstance) return connectSocket();
  return socketInstance;
}

export const socket = {
  emit: (...args) => getSocket().emit(...args),
  on: (...args) => getSocket().on(...args),
  off: (...args) => getSocket().off(...args),
  connect: () => getSocket().connect(),
  disconnect: () => getSocket().disconnect(),
  get connected() { return socketInstance?.connected || false; },
  get id() { return socketInstance?.id || null; },
};

export function getMatchmaker() {
  return {
    connect: () => ({ on: () => {}, dispose: () => {} }),
    getLobbies: () => new Promise((r) => socket.emit("getLobbies", (d) => r(d || []))),
    registerLobby: (info) => new Promise((res, rej) => {
      socket.emit("createLobby", info, (r) => r.error ? rej(new Error(r.error)) : res(r.lobby));
    }),
  };
}

export function getLobbyHandle(lobbyId) {
  const listeners = [];
  socket.on("lobbyUpdated", (s) => { if (s.id === lobbyId) listeners.forEach((fn) => fn(s)); });
  return {
    connect: () => ({
      on: (ev, fn) => { if (ev === "lobbyUpdated") listeners.push(fn); if (ev === "gameStarting") socket.on("gameStarting", fn); },
      sendMessage: ({ text }) => socket.emit("sendMessage", { text }),
      toggleReady: () => socket.emit("toggleReady"),
      leave: () => new Promise((r) => { socket.emit("leaveLobby"); setTimeout(r, 100); }),
      startGame: () => new Promise((r) => { socket.emit("launchGame"); setTimeout(r, 100); }),
      dispose: () => {},
    }),
    getState: () => new Promise((r) => {
      socket.emit("getLobbies", (l) => {
        const lobby = (l || []).find((x) => x.id === lobbyId);
        r(lobby || { players: [], messages: [], maxPlayers: 4 });
      });
    }),
    init: (info) => Promise.resolve(info),
    join: ({ password }) => new Promise((res, rej) => {
      socket.emit("joinLobby", { lobbyId, password }, (r) => r.error ? rej(new Error(r.error)) : res(r.lobby));
    }),
  };
}

export const client = {
  lobby: { getOrCreate: (id) => getLobbyHandle(id[0]) },
  matchmaker: { getOrCreate: () => getMatchmaker() },
};