import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import db from './db/index'; // your drizzle instance
import env from './env';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite', // or "mysql", "sqlite"
  }),
  advanced: {
    database: {
      generateId: 'serial', // Use serial (auto-increment) IDs
    },
    // 增加超时时间到 30 秒
    fetchOptions: {
      timeout: 30000,
    },
  },
  socialProviders: {
    github: { 
        clientId: env.GITHUB_CLIENT_ID, 
        clientSecret: env.GITHUB_CLIENT_SECRET, 
      }, 
    },
})
