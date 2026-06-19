import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const defaultApiBaseUrl = 'https://tcc-backend-jqod.onrender.com/api'
const permittedApiMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

type DesktopApiRequest = {
  path: string
  method: string
  body?: string
  token?: string
  responseType?: 'text' | 'binary'
}

const apiBaseUrl = () => {
  const configured = (process.env.DESKTOP_API_URL || defaultApiBaseUrl).replace(/\/$/, '')
  const url = new URL(configured)
  const isLocalHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)

  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('DESKTOP_API_URL must use HTTPS or a local HTTP address.')
  }
  if (!url.pathname.endsWith('/api')) {
    throw new Error('DESKTOP_API_URL must end with /api.')
  }

  return configured
}

const apiRequestUrl = (path: string) => {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('Invalid desktop API path.')
  }

  const url = new URL(`${apiBaseUrl()}${path}`)
  if (!url.pathname.startsWith('/api/')) {
    throw new Error('Desktop API request escaped the API prefix.')
  }

  return url
}

ipcMain.handle('desktop:api-request', async (event, request: DesktopApiRequest) => {
  if (!event.senderFrame || new URL(event.senderFrame.url).protocol !== 'file:') {
    throw new Error('Desktop API bridge is available only to the packaged application.')
  }
  if (!permittedApiMethods.has(request.method)) {
    throw new Error('Unsupported desktop API method.')
  }

  const response = await fetch(apiRequestUrl(request.path), {
    method: request.method,
    headers: {
      ...(request.body ? { 'Content-Type': 'application/json' } : {}),
      ...(request.token ? { Authorization: `Bearer ${request.token}` } : {}),
    },
    body: request.body,
  })

  const body = request.responseType === 'binary'
    ? new Uint8Array(await response.arrayBuffer())
    : await response.text()

  return {
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    body,
  }
})

ipcMain.handle('desktop:export-pdf', async (event, defaultFileName: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) throw new Error('Janela do relatorio nao encontrada.')

  const result = await dialog.showSaveDialog(window, {
    title: 'Exportar relatorio em PDF',
    defaultPath: defaultFileName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  })

  if (result.canceled || !result.filePath) return { canceled: true }

  const pdf = await window.webContents.printToPDF({
    pageSize: 'A4',
    landscape: false,
    printBackground: true,
    margins: {
      marginType: 'custom',
      top: 0.55,
      bottom: 0.55,
      left: 0.55,
      right: 0.55,
    },
  })

  await writeFile(result.filePath, pdf)
  return { canceled: false, filePath: result.filePath }
})

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    title: 'CollabResearch Admin Desktop',
    backgroundColor: '#f4f7fb',
    webPreferences: {
      preload: join(currentDir, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (new URL(url).protocol === 'https:') void shell.openExternal(url)
    } catch {
      return { action: 'deny' }
    }
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void window.loadFile(join(currentDir, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
