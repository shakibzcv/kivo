/// <reference types="vite/client" />

interface DesktopAuthUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  provider?: string;
}

interface ElectronAuthAPI {
  startGoogleAuth: () => Promise<{ started: boolean; port?: number; error?: string }>;
  cancelAuth: () => Promise<{ cancelled: boolean }>;
  onAuthSuccess: (callback: (data: { token: string; user: DesktopAuthUser }) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
}

interface Window {
  ipcRenderer?: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    off: (channel: string, ...args: any[]) => void;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
  electronAPI?: ElectronAuthAPI;
}
