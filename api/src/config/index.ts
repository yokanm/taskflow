const env = process.env as Record<string, string | undefined>;

const required = (key: string): string => {
  const value = env[key];
  if (!value) throw new Error(`${key} is not defined in environment variables`);
  return value;
};

export const config = {
  port: env['PORT'] ? parseInt(env['PORT']) : 3000,
  nodeEnv: env['NODE_ENV'] ?? 'development',

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
    refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },

  db: {
    url: required('DATABASE_URL'),
  },

  client: {
    url: process.env['CLIENT_URL'] ?? 'http://localhost:8081',
  },
} as const;