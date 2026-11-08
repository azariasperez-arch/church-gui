import { contextBridge, ipcRenderer } from "electron";

export type StagePayload = {
  presenting: boolean;
  title: string;
  subtitle?: string;
  lines: string[];
  index: number;
  total: number;
};

contextBridge.exposeInMainWorld("churchScreen", {
  openStage: () => ipcRenderer.invoke("stage:open"),
  closeStage: () => ipcRenderer.invoke("stage:close"),
  isStageOpen: () => ipcRenderer.invoke("stage:isOpen") as Promise<boolean>,
  pushStage: (payload: StagePayload) => ipcRenderer.send("stage:push", payload),
  onStageUpdate: (handler: (payload: StagePayload) => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: StagePayload) =>
      handler(payload);
    ipcRenderer.on("stage:update", listener);
    return () => ipcRenderer.removeListener("stage:update", listener);
  },
  onStageClosed: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on("stage:closed", listener);
    return () => ipcRenderer.removeListener("stage:closed", listener);
  },
});
