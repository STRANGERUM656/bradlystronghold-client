// URL del server - letto da localStorage, con fallback
export function getServerUrl() {
  return localStorage.getItem("bs_server_url") || "http://localhost:3000";
}

export function setServerUrl(url) {
  localStorage.setItem("bs_server_url", url);
}

export function clearServerUrl() {
  localStorage.removeItem("bs_server_url");
}

export const GAMES = [
  { id: "sh-crusader-1.41", name: "Stronghold Crusader 1.41", shortName: "Crusader 1.41", path: "F:\\All Stronghold Games\\Stronghold Crusader Versions\\Stronghold Crusader v1.41\\Stronghold Crusader.exe", icon: "🏰", maxPlayers: 8 },
  { id: "sh-crusader-1.3", name: "Stronghold Crusader 1.3", shortName: "Crusader 1.3", path: "F:\\All Stronghold Games\\Stronghold Crusader Versions\\Stronghold Crusader V1.3\\Stronghold Crusader.exe", icon: "🏰", maxPlayers: 8 },
  { id: "sh-crusader-1.1", name: "Stronghold Crusader 1.1", shortName: "Crusader 1.1", path: "F:\\All Stronghold Games\\Stronghold Crusader Versions\\Stronghold Crusader v1.1\\Stronghold Crusader.exe", icon: "🏰", maxPlayers: 8 },
  { id: "sh-hd", name: "Stronghold HD", shortName: "Stronghold HD", path: "F:\\All Stronghold Games\\Stronghold HD\\Stronghold.exe", icon: "🏯", maxPlayers: 8 },
  { id: "sh-crusader-extreme", name: "Stronghold Crusader Extreme", shortName: "Crusader Extreme", path: "F:\\All Stronghold Games\\Stronghold Crusader Extreme\\Stronghold Crusader Extreme.exe", icon: "⚔️", maxPlayers: 8 },
];

export const LANGUAGES = {
  it: { name: "Italiano", flag: "🇮🇹", strings: { lobby: "Lobby", friends: "Amici", settings: "Impostazioni" } },
  en: { name: "English", flag: "🇬🇧", strings: { lobby: "Lobby", friends: "Friends", settings: "Settings" } },
  es: { name: "Español", flag: "🇪🇸", strings: { lobby: "Lobby", friends: "Amigos", settings: "Ajustes" } },
  de: { name: "Deutsch", flag: "🇩🇪", strings: { lobby: "Lobby", friends: "Freunde", settings: "Einstellungen" } },
  fr: { name: "Français", flag: "🇫🇷", strings: { lobby: "Salon", friends: "Amis", settings: "Paramètres" } },
};

export const APP_VERSION = "1.0.0";