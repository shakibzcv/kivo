import { app, BrowserWindow, Menu, nativeTheme, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.name = 'Kivo';
app.setAppUserModelId('com.kivo.workspace');

// Register custom protocol handler for kivo://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('kivo', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('kivo');
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
    // Deep link url on Windows is passed in argv
    const deepLink = argv.find((arg) => arg.startsWith('kivo://'));
    if (deepLink) {
      handleAuthDeepLink(deepLink);
    }
  });
}

// macOS open-url handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleAuthDeepLink(url);
});

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null = null;
let authServer: http.Server | null = null;

function handleAuthDeepLink(urlString: string) {
  try {
    const parsed = new URL(urlString);
    const token = parsed.searchParams.get('token');
    const userRaw = parsed.searchParams.get('user');
    let user: any = null;

    if (userRaw) {
      try {
        user = JSON.parse(decodeURIComponent(userRaw));
      } catch {
        user = { email: userRaw };
      }
    }

    if (token && win && !win.isDestroyed()) {
      win.webContents.send('auth:success', { token, user });
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  } catch (err) {
    console.error('[Auth] Failed to parse deep link URL:', err);
  }
}

function stopAuthServer() {
  if (authServer) {
    try {
      authServer.close();
    } catch {
      // Ignore close errors
    }
    authServer = null;
  }
}

function startAuthLoopbackServer(): Promise<{ port: number }> {
  return new Promise((resolve) => {
    stopAuthServer();

    const server = http.createServer((req, res) => {
      // Enable CORS for web browser requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');

      if (parsedUrl.pathname === '/callback') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          let token = parsedUrl.searchParams.get('token');
          let user: any = null;

          if (body) {
            try {
              const parsedBody = JSON.parse(body);
              if (parsedBody.token) token = parsedBody.token;
              if (parsedBody.user) user = parsedBody.user;
            } catch {
              // Ignore body parse errors
            }
          }

          if (!user && parsedUrl.searchParams.get('user')) {
            try {
              user = JSON.parse(decodeURIComponent(parsedUrl.searchParams.get('user')!));
            } catch {
              user = { email: parsedUrl.searchParams.get('user') };
            }
          }

          if (token && win && !win.isDestroyed()) {
            win.webContents.send('auth:success', { token, user });
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
          }

          // Return reassuring confirmation HTML to the browser
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Kivo Desktop - Authenticated</title>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #111111;
                    color: #ededed;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                  }
                  .card {
                    background: #181818;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 36px 32px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 12px 36px rgba(0,0,0,0.4);
                  }
                  h2 { margin: 0 0 10px; font-size: 20px; color: #fff; font-weight: 600; }
                  p { margin: 0 0 24px; color: #9b9b9b; font-size: 13px; line-height: 1.5; }
                  button {
                    background: #0085FF;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 24px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                  }
                  button:hover { background: #0073e6; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>Authenticated with Kivo</h2>
                  <p>Session transmitted to Kivo Desktop. You can safely close this browser tab.</p>
                  <button onclick="window.close()">Close Tab</button>
                </div>
                <script>
                  setTimeout(() => {
                    try { window.close(); } catch(e) {}
                  }, 2000);
                </script>
              </body>
            </html>
          `);

          // Stop loopback server after successful receipt
          setTimeout(() => {
            stopAuthServer();
          }, 3000);
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.on('error', (err) => {
      console.warn('[Auth] Loopback server error on primary port, trying random port:', err);
      // Try ephemeral port if 28282 is unavailable
      const fallbackServer = http.createServer(server.listeners('request')[0] as any);
      fallbackServer.listen(0, '127.0.0.1', () => {
        authServer = fallbackServer;
        const port = (fallbackServer.address() as AddressInfo).port;
        resolve({ port });
      });
    });

    server.listen(28282, '127.0.0.1', () => {
      authServer = server;
      const port = (server.address() as AddressInfo).port;
      resolve({ port });
    });
  });
}

function updateTitleBarTheme() {
  if (!win || win.isDestroyed()) return;
  const isDark = nativeTheme.shouldUseDarkColors;
  const bg = isDark ? '#111111' : '#f8f9fa';
  const symbol = isDark ? '#ededed' : '#111827';

  if (process.platform === 'win32') {
    win.setTitleBarOverlay({
      color: bg,
      symbolColor: symbol,
      height: 36,
    });
  }
  win.setBackgroundColor(bg);
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const isDark = nativeTheme.shouldUseDarkColors;
  const bg = isDark ? '#111111' : '#f8f9fa';
  const symbol = isDark ? '#ededed' : '#111827';

  win = new BrowserWindow({
    title: 'Kivo',
    icon: path.join(process.env.VITE_PUBLIC || RENDERER_DIST, 'electron-vite.svg'),
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: bg,
      symbolColor: symbol,
      height: 36,
    },
    backgroundColor: bg,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  win.removeMenu();

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

function setupAutoUpdater() {
  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('Error checking for updates:', err);
    });
  }
}

// IPC Handlers for Authentication & Shell actions
ipcMain.handle('auth:start-google', async () => {
  try {
    const { port } = await startAuthLoopbackServer();
    const webBaseUrl = process.env.VITE_WEB_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const authUrl = `${webBaseUrl}/login?source=desktop&port=${port}`;
    await shell.openExternal(authUrl);
    return { started: true, port };
  } catch (err: any) {
    console.error('[Auth] Failed to start Google Auth:', err);
    return { started: false, error: err.message };
  }
});

ipcMain.handle('auth:cancel', () => {
  stopAuthServer();
  return { cancelled: true };
});

ipcMain.handle('shell:open-external', async (_event, url: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('kivo://'))) {
    await shell.openExternal(url);
  }
});

app.on('window-all-closed', () => {
  stopAuthServer();
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  nativeTheme.on('updated', () => {
    updateTitleBarTheme();
  });
});
