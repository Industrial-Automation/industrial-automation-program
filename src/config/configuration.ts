import 'dotenv/config';

export const Configuration = Object.freeze({
  NODE_ENV: process.env.NODE_ENV,

  API_URL: process.env.API_URL
});
