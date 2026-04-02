# Deployment Guide

This project uses:
- Frontend: Vercel (Next.js app in client)
- Backend: Render (Express API in server)
- Database: Supabase PostgreSQL

## 1) Deploy Backend on Render

1. Open Render dashboard and click New + > Blueprint.
2. Connect your GitHub repo: https://github.com/dadhalekanchan-stack/gamee.git
3. Render will detect render.yaml.
4. In service environment variables, set:
   - DATABASE_URL = your Supabase Postgres connection string
   - JWT_SECRET = a long random secret
   - JWT_EXPIRES_IN = 7d
   - CLIENT_ORIGIN = temporary value like https://example.com (update after Vercel deploy)
5. Deploy.
6. After deployment, verify API is live by opening:
   - https://<your-render-service>.onrender.com/health

## 2) Deploy Frontend on Vercel

1. Open Vercel dashboard and click Add New > Project.
2. Import repo: https://github.com/dadhalekanchan-stack/gamee.git
3. Configure:
   - Root Directory: client
   - Framework Preset: Next.js
4. Add environment variable:
   - NEXT_PUBLIC_API_BASE_URL = https://<your-render-service>.onrender.com/api
5. Deploy.
6. Copy your Vercel URL (for example: https://gamee.vercel.app).

## 3) Final CORS Update on Render

1. Go back to Render service environment variables.
2. Set CLIENT_ORIGIN to your Vercel URL.
3. Redeploy backend.

If you use Vercel preview URLs too, set CLIENT_ORIGIN as comma-separated values:
https://gamee.vercel.app,https://gamee-git-main-<team>.vercel.app

## 4) Verify End-to-End

1. Open Vercel link.
2. Register/login.
3. Start game and answer questions.
4. Confirm EXP updates and API calls succeed.

## Notes

- Keep server/.env and client/.env.local out of Git (already ignored).
- If first backend request is slow on free plan, wait a few seconds and retry.
