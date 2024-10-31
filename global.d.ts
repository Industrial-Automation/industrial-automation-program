export {};

declare global {
  interface Window {
    config: {
      NODE_ENV: string;
      API_URL: string;
    };
  }
}
