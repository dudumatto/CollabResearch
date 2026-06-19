import { contextBridge, ipcRenderer } from 'electron'

type DesktopApiRequest = {
  path: string
  method: string
  body?: string
  token?: string
  responseType?: 'text' | 'binary'
}

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  version: process.versions.electron,
  request: (request: DesktopApiRequest) => ipcRenderer.invoke('desktop:api-request', request),
  exportPdf: (defaultFileName: string) => ipcRenderer.invoke('desktop:export-pdf', defaultFileName),
})
