const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('config', {
  NODE_ENV: process.env.NODE_ENV || '',
  API_URL: process.env.API_URL || ''
});
