# 🔧 Fixed: "Failed to fetch" Error

## Problem
When trying to sign up, you got: **"Failed to fetch"** error

## Root Cause
The frontend didn't have the `NEXT_PUBLIC_API_BASE_URL` environment variable configured, so it couldn't connect to the backend API.

## Solution Applied
Created `frontend/.env.local` with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

And updated `backend/.env` with:
```
GOOGLE_CLIENT_ID=false
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
JWT_SECRET=dev-jwt-secret-key
SESSION_COOKIE_SAMESITE=Lax
SESSION_COOKIE_SECURE=false
```

## What This Does

1. **`NEXT_PUBLIC_API_BASE_URL`** (Frontend)
   - Tells the Next.js frontend where to find the API
   - Value: `http://localhost:8000` (where Flask backend runs)

2. **`FRONTEND_ORIGINS`** (Backend)
   - Tells Flask which frontend origins are allowed (CORS)
   - Includes all common localhost ports: 3000, 3001, 3002, 3003
   - This fixes CORS "blocked by browser" errors

## How to Use Now

### Option 1: Auto (Recommended)
Just run:
```bash
npm run dev
```

The setup is complete. Go to http://localhost:3003 (or whichever port is available) and try signing up again!

### Option 2: Manual Setup
If you want to configure differently:

1. Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

2. Create/Update `backend/.env`:
```
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
JWT_SECRET=your-secret-key
SESSION_COOKIE_SAMESITE=Lax
SESSION_COOKIE_SECURE=false
```

3. Restart servers: `npm run dev`

## Verify It Works

Test in your browser now:
1. Open http://localhost:3003 (check terminal for actual port if different)
2. Click "Sign Up"
3. Fill in form and click "Create Account"
4. You should see a success message and be logged in ✅

Or test via curl:
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"yourname@example.com","password":"password123","username":"yourname"}'
```

Should return:
```json
{
  "access_token": "...",
  "message": "Signup successful",
  "user": { ... }
}
```

## Files Changed
- ✅ Created: `frontend/.env.local`
- ✅ Updated: `backend/.env`

## Next Time
These files are now in place, so you won't need to recreate them. Just run `npm run dev` and you're good to go!

---

**Issue resolved!** Try signing up now. If you get any other errors, let me know. 🚀
