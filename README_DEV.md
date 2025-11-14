# HopOn Development Setup

## Quick Start

From the repository root, run:

```bash
npm run dev
```

This will:
1. Clean up any existing processes on ports 3000 and 8000
2. Set up the Python virtual environment (if needed)
3. Start the **Next.js frontend** (usually on `http://localhost:3000`)
4. Start the **Flask backend** (on `http://localhost:8000`)

Both services will run in parallel and restart automatically when you change code.

## Environment Variables

### Backend (Flask)

Create `backend/.env` (or copy from `backend/.env.example`):

```bash
# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Security & JWT
JWT_SECRET=your-secret-key
SESSION_COOKIE_SAMESITE=Lax
SESSION_COOKIE_SECURE=false

# Frontend Origins
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
# (SQLite by default at instance/hopon.db)
```

### Frontend (Next.js)

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Testing

### Create an Account (Sign Up)
1. Open http://localhost:3001
2. Click **Sign Up** in the top-right
3. Fill in username, email, password
4. Click **Create Account**
5. You'll be logged in and redirected to your profile

### Sign In (Login)
1. From the home page, click **Sign In**
2. Enter your email and password, or:
   - Click **Continue with Google** for OAuth
   - Click **Try as Demo User** for demo account (no credentials needed)

### Demo Login (without Google OAuth)

1. Open http://localhost:3001 (or http://localhost:3000 if 3000 is in use)
2. Click **Sign In** → **Try as Demo User**
3. You'll be logged in with a test user

### Google OAuth (requires setup)

1. Register a Google OAuth app at [Google Cloud Console](https://console.cloud.google.com/)
2. Add redirect URI: `http://localhost:8000/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
4. Restart the backend: `Ctrl+C` and run `npm run dev` again
5. Click **Sign In** → **Continue with Google**

## Troubleshooting

### Port Already in Use

If you see "Port 3000/8000 is in use", the `npm run cleanup` script should handle it automatically.

**Manual cleanup:**
```bash
# Kill Next.js processes
pkill -9 -f "next dev"

# Kill Flask processes
pkill -9 -f "python.*app.py"

# Or kill specific ports
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :8000 | xargs kill -9 2>/dev/null
```

### Backend won't start

- Check that Python 3.9+ is installed: `python3 --version`
- Check that the venv was created: `ls backend/.venv/bin/python`
- Reinstall dependencies: `rm -rf backend/.venv && npm run setup:backend`

### Frontend won't compile

- Check Node version: `node --version` (should be 16+)
- Clear Next cache: `rm -rf frontend/.next`
- Reinstall dependencies: `rm -rf frontend/node_modules frontend/pnpm-lock.yaml && npm install`

### CORS errors

- Ensure `FRONTEND_ORIGINS` in `backend/.env` includes the frontend URL
- Ensure `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` points to the backend
- Check the browser console for exact error messages

## Available Scripts

From the repository root:

- `npm run dev` — Start both frontend and backend in development mode
- `npm run cleanup` — Kill any existing processes on ports 3000 and 8000
- `npm run dev:frontend` — Start only the Next.js frontend
- `npm run dev:backend` — Start only the Flask backend
- `npm run setup:backend` — Set up Python venv and install backend dependencies

## Project Structure

```
.
├── frontend/                    # Next.js frontend (React 19, TypeScript, Tailwind)
│   ├── src/
│   │   ├── app/                # Next.js app router (pages)
│   │   ├── components/         # React components
│   │   ├── context/            # React context (auth, etc.)
│   │   └── lib/                # Utilities and API client
│   └── package.json
├── backend/                     # Flask backend (Python)
│   ├── app.py                  # Main Flask app
│   ├── models.py               # SQLAlchemy models
│   ├── pyproject.toml          # Dependencies
│   └── instance/               # SQLite database
├── package.json                # Root orchestration scripts
└── README_DEV.md               # This file
```

## Architecture

- **Frontend**: Next.js 15 with App Router, React Context for auth, Tailwind CSS
- **Backend**: Flask 3 with SQLAlchemy ORM, JWT tokens, Google OAuth support
- **Auth Flow**:
  - Demo: `POST /auth/demo-login` → access token + refresh cookie
  - Google: popup → OAuth callback → postMessage → access token + refresh cookie
  - Refresh: `POST /auth/refresh` (uses httpOnly cookie)
- **Database**: SQLite (file-based, no setup required)
- **API**: RESTful endpoints (events, users, auth)

## Next Steps

- Implement additional features as needed
- Add tests (unit, integration, e2e)
- Deploy to staging/production
- Set up CI/CD pipeline

For detailed API documentation and backend notes, see `SYNC_NOTES.md`.
