# 🚀 HopOn Authentication System - Quick Start

## What You Get

✅ **Complete user authentication system** with:
- Email/password signup and login
- Google OAuth integration
- Demo user for testing
- Secure password hashing
- JWT token management with refresh via HTTP-only cookies
- Session persistence

## One Command to Run Everything

```bash
npm run dev
```

This automatically:
1. Cleans up any stale processes
2. Sets up the Python venv (if needed)
3. Starts the Next.js frontend (port 3001)
4. Starts the Flask backend (port 8000)

Both run in parallel and auto-reload on code changes.

## Test It Out

### Sign Up a New Account
1. Open http://localhost:3001
2. Click **"Sign Up"** (top-right)
3. Fill in username, email, password
4. Click **"Create Account"**
5. ✅ You're logged in!

### Sign In
1. Click **"Sign In"** (top-right) 
2. Enter your email and password, then click **"Sign In"**
   - OR click **"Continue with Google"** for Google OAuth
   - OR click **"Try as Demo User"** to skip credentials

### Try Google OAuth
1. Get Google credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Add redirect URI: `http://localhost:8000/auth/google/callback`
3. Set in `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-id
   GOOGLE_CLIENT_SECRET=your-secret
   ```
4. Restart backend: `Ctrl+C` then `npm run dev`
5. Sign in with Google!

## Files Created/Modified

### Backend (Flask)
- `backend/models.py` — Added password hashing to User model
- `backend/app.py` — Added `/auth/signup` and `/auth/login` endpoints

### Frontend (Next.js)
- `frontend/src/app/signup/page.tsx` — NEW: Sign up form page
- `frontend/src/app/login/page.tsx` — UPDATED: Sign in page with Google + Demo options
- `frontend/src/context/auth-context.tsx` — Added signup/login methods
- `frontend/src/lib/api.ts` — Added signup/login API methods
- `frontend/src/components/top-nav.tsx` — Updated navigation

## Key Features

🔐 **Security**
- Passwords hashed with werkzeug
- HTTP-only refresh token cookies
- Same-site CSRF protection
- Email/username uniqueness validation

⚡ **Developer Experience**
- One-command startup
- Auto-reload on code changes
- Clear error messages
- Demo user for quick testing
- Google OAuth integration ready

🎨 **User Experience**
- Beautiful login/signup forms
- Loading states and error handling
- Auto-redirect after auth
- Multiple sign-in methods
- Username display in navigation

## Troubleshooting

**"Port 3000 is in use"**
- Cleanup runs automatically, but if you see port 3001 used instead, that's fine!
- Manual cleanup: `lsof -ti :3000 | xargs kill -9 2>/dev/null`

**Backend won't start**
- Check Python 3.9+: `python3 --version`
- Reinstall: `rm -rf backend/.venv && npm run setup:backend`

**Frontend won't compile**
- Clear cache: `rm -rf frontend/.next`
- Reinstall: `rm -rf frontend/node_modules && npm install`

**CORS errors**
- Check `backend/.env` has `FRONTEND_ORIGINS=http://localhost:3001`
- Check `frontend/.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

## What's Next?

See `AUTH_SYSTEM.md` for:
- Detailed implementation details
- Security features explained
- Recommended next steps (profile editing, password reset, email verification, etc.)

See `README_DEV.md` for:
- Full development setup guide
- Environment variables reference
- Architecture overview
- Common issues and solutions

## Test Endpoints (via curl)

```bash
# Sign up
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c /tmp/cookies.txt

# Check session (uses cookie)
curl http://localhost:8000/auth/session -b /tmp/cookies.txt
```

---

**Ready to go!** 🎉 Run `npm run dev` and start testing the authentication system.
