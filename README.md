# Academia 2D RPG - Local Setup Guide (Second Computer)

This guide includes exact terminal commands and where to run them.

## Project Structure

- `client` = Next.js frontend
- `server` = Node.js + Express backend
- `server/db/schema.sql` = DB schema + seed questions

## Prerequisites

Install first:

1. Node.js 20.x
2. npm (comes with Node.js)
3. PostgreSQL/Supabase database access

## Step 1) Open Project Root

Open VS Code terminal (PowerShell) and run from anywhere:

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)"
```

Replace `YourName` with the current PC username.

## Step 2) Install Dependencies

Where to run: **Terminal 1 at project root**

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)"
cd server
npm install
cd ..
cd client
npm install
cd ..
```

## Step 3) Create Backend `.env`

Where to run: **Terminal 1 at project root**

```powershell
@"
PORT=5000
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
"@ | Set-Content -Path ".\server\.env"
```

Update these values:

1. `DATABASE_URL` = your real DB connection string
2. `JWT_SECRET` = your own random secret

## Step 4) Create Frontend `.env.local`

Where to run: **Terminal 1 at project root**

```powershell
@"
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
"@ | Set-Content -Path ".\client\.env.local"
```

## Step 5) Start Backend

Open **Terminal 2** and run:

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)\server"
npm run dev
```

Keep Terminal 2 running.

## Step 6) Start Frontend

Open **Terminal 3** and run:

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)\client"
npm run dev
```

Keep Terminal 3 running.

## Step 7) Health Check

Open in browser:

1. `http://localhost:5000/health`

Expected response:

1. `{"ok":true}`

## Step 8) Run App

Open in browser:

1. `http://localhost:3000`

Then test:

1. Register
2. Login
3. Start game
4. Answer a question

## Useful Local URLs

1. Frontend: `http://localhost:3000`
2. Backend health: `http://localhost:5000/health`
3. Encounters API test:
   `http://localhost:5000/api/encounters?zone=physics_town&difficulty=basic`

## Common Issues and Fixes

### 1) `Failed to fetch`

Where to run: **new terminal at project root**

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)"
type .\client\.env.local
type .\server\.env
```

Verify:

1. `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api`
2. `CLIENT_ORIGIN=http://localhost:3000`

Then restart both servers (Terminal 2 and Terminal 3).

### 2) `Cannot GET /` on backend URL

This is normal. Use:

1. `/health`
2. `/api/...` routes

### 3) Port already in use

Where to run: **any terminal**

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Then restart backend and frontend terminals.

### 4) If copied from Google Drive

Make sure these folders exist exactly:

1. `client`
2. `server`

Do not rename them.

## Optional: Production Build Locally

Backend (Terminal A):

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)\server"
npm start
```

Frontend (Terminal B):

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)\client"
npm run build
npm run start
```

## PWA/Web App Files (Must Copy to Second Computer)

If you want installable web-app behavior, make sure these files are copied too:

1. `client/src/app/manifest.js`
2. `client/public/sw.js`
3. `client/public/offline.html`
4. `client/public/icons/pwa-192.svg`
5. `client/public/icons/pwa-512.svg`
6. `client/src/components/ServiceWorkerRegister.jsx`
7. `client/src/app/layout.js` (updated metadata)
8. `client/src/app/providers.jsx` (service worker registration)
9. `client/next.config.js` (service-worker headers)

After copying these files, run this again on second computer:

```powershell
cd "C:\Users\YourName\Desktop\KD_BCA_project - Copy (2)\client"
npm install
npm run dev
```

For install prompt to work best, use HTTPS deployment (Vercel URL).
