const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "BradlyStronghold",
    backgroundColor: "#0a1420",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL("data:text/html,<h1 style='color:red;font-family:sans-serif;padding:40px'>ERRORE: index.html non trovato</h1>");
    }
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

ipcMain.handle("launch-game", async (event, { gamePath, playerName, host }) => {
  if (!gamePath) throw new Error("Percorso non valido");
  if (!fs.existsSync(gamePath)) throw new Error("File non trovato: " + gamePath);
  const game = spawn(gamePath, [], {
    env: { ...process.env, PLAYER_NAME: playerName || "", LOBBY_HOST: host || "" },
    cwd: path.dirname(gamePath),
    detached: false,
  });
  return { pid: game.pid };
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (mainWindow === null) createWindow(); });