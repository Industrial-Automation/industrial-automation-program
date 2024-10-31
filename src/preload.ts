const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('config', {
  NODE_ENV: process.env.NODE_ENV || '',
  API_URL: process.env.API_URL || ''
});

contextBridge.exposeInMainWorld('api', {
  startOPCClient: (opc_url: string, opc_namespace_index: number) =>
    ipcRenderer.send('start-opc-client', opc_url, opc_namespace_index),
  onOPCClientResponse: (callback: (message: string) => void) =>
    ipcRenderer.on('opc-client-response', (_, message: string) => callback(message))
});
