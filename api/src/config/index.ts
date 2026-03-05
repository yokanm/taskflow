import 'dotenv/config';

const get = (key: string): string => {
  const value = (process.env as Record<string, string | undefined>)[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

export const config = {
  port: parseInt(process.env['PORT'] ?? '3000'),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  jwt: {
    secret:              get('JWT_SECRET'),
    refreshSecret:       get('JWT_REFRESH_SECRET'),
    accessExpiresIn:     '15m',
    refreshExpiresIn:    '7d',
    refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },

  db: {
    url: get('DATABASE_URL'),
  },

  client: {
    url: process.env['CLIENT_URL'] ?? 'http://localhost:8081',
  },
} as const;