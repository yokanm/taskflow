// api/src/config/index.ts
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT:                z.string().default('3000').transform(Number),
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET:          z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET:  z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  DATABASE_URL:        z.string().startsWith('file:'),
  CLIENT_URL:          z.string().url().default('http://localhost:8081'),
});

// This runs once at startup — if anything is wrong, the server won't start
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // explicit, clean failure
}

export const config = {
  port:    parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  jwt: {
    secret:              parsed.data.JWT_SECRET,
    refreshSecret:       parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn:     '15m',
    refreshExpiresIn:    '7d',
    refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  },
  db:     { url: parsed.data.DATABASE_URL },
  client: { url: parsed.data.CLIENT_URL },
} as const;