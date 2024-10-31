import * as path from 'path';
import * as async from 'async';

import { app, BrowserWindow, ipcMain } from 'electron';
import { AttributeIds, ClientSession, OPCUAClient } from 'node-opcua';

require('dotenv').config();

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: process.env.NODE_ENV === 'development',
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('start-opc-client', (event, opc_url: string, opc_namespace_index: number) => {
  const client = OPCUAClient.create({ endpointMustExist: true });

  client.on('backoff', (retry, delay) => {
    event.sender.send(
      'opc-client-response',
      `Try to connect to ${opc_url}, retry ${retry} next attempt in ${delay / 1000} sec`
    );
  });

  let clientSession: ClientSession | null = null;

  async.series([
    (callback) => {
      client.connect(opc_url, (err) => {
        if (err) {
          event.sender.send('opc-client-response', `Cannot connect to endpoint: ${opc_url}`);
        }

        callback();
      });
    },
    (callback) => {
      client.createSession((err, session) => {
        if (err) {
          event.sender.send('opc-client-response', `Session creation error: ${opc_url}`);

          return;
        }

        clientSession = session;

        callback();
      });
    },
    () => {
      setInterval(() => {
        clientSession.read(
          {
            nodeId: `ns=${opc_namespace_index};s="OPC_UA_DB".test`,
            attributeId: AttributeIds.Value
          },
          (err, dataValue) => {
            if (err) {
              event.sender.send('opc-client-response', `Read Value error: ${opc_url}`);

              return;
            }

            // eslint-disable-next-line no-console
            console.log(`value1: ${dataValue.value.value}`);
          }
        );
      });
    }
  ]);
});
