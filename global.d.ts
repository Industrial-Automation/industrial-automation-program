export {};

declare global {
  interface Window {
    config: {
      NODE_ENV: string;
      API_URL: string;
    };
    api: {
      startOPCClient: (project_id: string, opc_url: string, opc_namespace_index: number) => void;
      onOPCClientResponse: (callback: (message: string) => void) => Electron.IpcRenderer;
    };
  }
}
