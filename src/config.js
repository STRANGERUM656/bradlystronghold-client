// src/config.js
export function getRivetEndpoint() {
    const saved = localStorage.getItem('bs_server_url');
    if (saved) return saved;
    return "https://bradlystronghold-backend.onrender.com";
}
