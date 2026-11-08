import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let operatorWindow: BrowserWindow | null = null;
let stageWindow: BrowserWindow | null = null;

function preloadPath() {
  return path.join(__dirname, "preload.mjs");
}

function createOperatorWindow() {
  operatorWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Church Screen — Operador",
    backgroundColor: "#1a1f24",
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    operatorWindow.loadURL("http://localhost:5177");
  } else {
    operatorWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  operatorWindow.on("closed", () => {
    operatorWindow = null;
    if (stageWindow) {
      stageWindow.close();
      stageWindow = null;
    }
  });
}

function createStageWindow() {
  if (stageWindow) {
    stageWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const target =
    displays.find((d) => d.id !== screen.getPrimaryDisplay().id) || displays[0];

  stageWindow = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.bounds.width,
    height: target.bounds.height,
    fullscreen: displays.length > 1,
    simpleFullscreen: process.platform === "darwin",
    title: "Church Screen — Proyección",
    backgroundColor: "#0b0e11",
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const stageHash = "#/stage";
  if (isDev) {
    stageWindow.loadURL(`http://localhost:5177/${stageHash}`);
  } else {
    stageWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/stage",
    });
  }

  stageWindow.on("closed", () => {
    stageWindow = null;
    operatorWindow?.webContents.send("stage:closed");
  });
}

function broadcastStage(payload: unknown) {
  stageWindow?.webContents.send("stage:update", payload);
}

app.whenReady().then(() => {
  createOperatorWindow();

  ipcMain.handle("stage:open", () => {
    createStageWindow();
    return true;
  });

  ipcMain.handle("stage:close", () => {
    stageWindow?.close();
    stageWindow = null;
    return true;
  });

  ipcMain.on("stage:push", (_event, payload) => {
    broadcastStage(payload);
  });

  ipcMain.handle("stage:isOpen", () => Boolean(stageWindow));

  globalShortcut.register("CommandOrControl+Shift+P", () => {
    if (stageWindow) {
      stageWindow.close();
      stageWindow = null;
    } else {
      createStageWindow();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createOperatorWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
