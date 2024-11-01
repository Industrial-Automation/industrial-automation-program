import * as path from 'path';
import * as async from 'async';

import * as fetch from 'node-fetch';
import { app, BrowserWindow, ipcMain, session } from 'electron';
import { AttributeIds, ClientSession, DataType, OPCUAClient } from 'node-opcua';

require('dotenv').config({
  path: app.isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.resolve(process.cwd(), '.env')
});

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

ipcMain.on(
  'start-opc-client',
  (event, project_id: string, opc_url: string, opc_namespace_index: number) => {
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
        setInterval(async () => {
          const cookies = await session.defaultSession.cookies.get({});

          const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

          const tagsResponse = await fetch(
            `${process.env.API_URL}/project-tags/writable/${project_id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                cookie: cookieString
              }
            }
          );

          const tagsResult: any = await tagsResponse.json();

          const tags = tagsResult.data.tags as Array<{ tag: string; value: boolean | number }>;

          tags.forEach(({ tag, value }) => {
            const dataType =
              typeof value === 'boolean'
                ? DataType.Boolean
                : typeof value === 'number'
                  ? Number.isInteger(value)
                    ? DataType.Int16
                    : DataType.Float
                  : DataType.Null;

            clientSession.write(
              {
                nodeId: `ns=${opc_namespace_index};s=${tag}`,
                attributeId: AttributeIds.Value,
                indexRange: null,
                value: {
                  value: {
                    dataType,
                    value
                  }
                }
              },
              (err, status) => {
                if (err || status.value !== 0) {
                  event.sender.send(
                    'opc-client-response',
                    `Write Value error: ${opc_url}; Tag: ${tag}`
                  );
                }
              }
            );
          });
        }, 3000);

        setInterval(async () => {
          const cookies = await session.defaultSession.cookies.get({});

          const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

          const tagsResponse = await fetch(
            `${process.env.API_URL}/project-tags/readable/${project_id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                cookie: cookieString
              }
            }
          );

          const tagsResult: any = await tagsResponse.json();

          const tags = tagsResult.data.tags as Array<{ id: string; tag: string; table: string }>;

          tags.forEach(({ id, tag, table }) => {
            clientSession.read(
              {
                nodeId: `ns=${opc_namespace_index};s=${tag}`,
                attributeId: AttributeIds.Value
              },
              async (err, dataValue) => {
                if (err || dataValue.statusCode.value !== 0) {
                  event.sender.send(
                    'opc-client-response',
                    `Read Value error: ${opc_url}; Tag: ${tag}`
                  );

                  return;
                }

                await fetch(`${process.env.API_URL}/project-tags/${project_id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    cookie: cookieString
                  },
                  body: JSON.stringify({ id, table, value: dataValue.value.value })
                });
              }
            );
          });
        }, 3000);
      }
    ]);
  }
);
