/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    VITE_PUBLIC: string;
    VITE_WEB_URL?: string;
    CLIENT_URL?: string;
  }
}

export interface DesktopAuthUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  provider?: string;
}

export interface ElectronAuthAPI {
  startGoogleAuth: () => Promise<{ started: boolean; port?: number; error?: string }>;
  cancelAuth: () => Promise<{ cancelled: boolean }>;
  onAuthSuccess: (callback: (data: { token: string; user: DesktopAuthUser }) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer;
  electronAPI: ElectronAuthAPI;
}
