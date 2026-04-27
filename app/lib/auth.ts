import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import db from './db/index'; // your drizzle instance
import env from './env';
import { createAuthMiddleware } from 'better-auth/api';

export const auth = betterAuth({
  hooks:{
    after: createAuthMiddleware(async (ctx)=>{
      if(ctx.path === '/get-session'){
        if(!ctx.context.session){
          return ctx.json({
            session: null,
            user: null,
          })
        }
      }
    })
  },

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
