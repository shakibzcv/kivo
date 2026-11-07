import { ipcRenderer, contextBridge } from 'electron';

// --------- Expose Auth & Electron API to Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  startGoogleAuth: () => ipcRenderer.invoke('auth:start-google'),
  cancelAuth: () => ipcRenderer.invoke('auth:cancel'),
  onAuthSuccess: (callback: (data: { token: string; user: any }) => void) => {
    const handler = (_event: any, data: { token: string; user: any }) => callback(data);
    ipcRenderer.on('auth:success', handler);
    return () => ipcRenderer.off('auth:success', handler);
  },
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});
