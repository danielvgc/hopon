# HopOn

A web application that helps sports enthusiasts discover and participate in local pickup games. Users can connect with players, find games near their location, and host their own events.

## Features

Discover Games: Find pickup games and sports events near your location
Connect with Players: Browse player profiles and build your sports network
Location-Based Search: Find games happening nearby with real-time distance calculations
Create Events: Host your own pickup games and invite players
Google OAuth Authentication: Secure login with Google
Responsive Design: Works on desktop and mobile devices

## Tech Stack

### Frontend
Framework: Next.js 15 with TypeScript
Styling: Tailwind CSS
UI Components: Shadcn/ui
State Management: React Context API
Authentication: Google OAuth 2.0

### Backend
Framework: Flask (Python)
Database: PostgreSQL
Authentication: JWT tokens with refresh token rotation
API: RESTful API with session management

### Deployment
Frontend: Vercel (https://vercel.com)
Backend: Render (https://render.com)
Database: PostgreSQL on Render

---

## Project Structure

```
hopon/
├── backend/
│   ├── app.py                 Flask application with all routes
│   ├── models.py              SQLAlchemy ORM models
│   ├── pyproject.toml         Python dependencies and project config
│   ├── uv.lock                Locked dependency versions
│   ├── .env.example           Environment variables template
│   └── Dockerfile             Container configuration for Render
│
├── frontend/
│   ├── src/
│   │   ├── app/               Next.js app router pages
│   │   │   ├── page.tsx       Landing page
│   │   │   ├── login/         User login page
│   │   │   ├── signup/        User registration page
│   │   │   ├── home/          Main app with sidebar layout
│   │   │   ├── create/        Create new event page
│   │   │   ├── discover/      Browse all games page
│   │   │   ├── events/        User's events page
│   │   │   └── profile/       User profile page
│   │   ├── components/        Reusable React components
│   │   │   └── ui/            Shadcn UI components
│   │   ├── context/           React Context for auth state
│   │   ├── hooks/             Custom React hooks
│   │   └── lib/
│   │       ├── api.ts         API client functions
│   │       ├── utils.ts       Utility functions
│   │       └── fallback-data.ts   Development fallback data
│   ├── public/                Static assets
│   ├── package.json           Frontend dependencies
│   ├── pnpm-lock.yaml         Locked npm dependency versions
│   ├── next.config.ts         Next.js configuration
│   ├── tsconfig.json          TypeScript configuration
│   └── postcss.config.mjs      PostCSS and Tailwind configuration
│
├── .gitignore                 Git ignore rules
└── README.md                  This file
```

---

## Getting Started

### Prerequisites
Node.js 18 or later (for frontend)
Python 3.11 or later (for backend)
pnpm (recommended) or npm

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Create environment configuration
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key" >> .env.local

# Start development server
pnpm dev
```

The frontend will be available at http://localhost:3000.

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Create environment configuration
cp .env.example .env

# Edit .env with required values:
# FRONTEND_ORIGINS=http://localhost:3000
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# DATABASE_URL= (leave empty for local SQLite)

# Start development server
python app.py
```

The API will be available at http://localhost:8000.

---

## Environment Variables

### Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL: Backend API URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Google Maps API key for location features

### Backend (.env)
FRONTEND_ORIGINS: Comma-separated list of allowed frontend URLs
GOOGLE_CLIENT_ID: Google OAuth application ID
GOOGLE_CLIENT_SECRET: Google OAuth application secret
DATABASE_URL: PostgreSQL connection string (production only, leave empty for local SQLite)
JWT_SECRET: Secret key for JWT token signing
SESSION_COOKIE_SAMESITE: Cookie same-site policy (Lax, Strict, or None)
SESSION_COOKIE_SECURE: Enable secure cookie flag for HTTPS
DEV_GOOGLE_LOGIN: Enable local development Google OAuth fallback

See `backend/.env.example` for complete reference.

## Deployment

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Connect repository to Vercel dashboard
3. Set NEXT_PUBLIC_API_BASE_URL environment variable
4. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
5. Vercel will automatically deploy on push to main branch

### Deploy Backend to Render

1. Create PostgreSQL database on Render
2. Create new Web Service on Render
3. Connect to GitHub repository
4. Set environment variables in Render dashboard:
   FRONTEND_ORIGINS: https://hopon.vercel.app (and any preview URLs)
   DATABASE_URL: PostgreSQL connection string
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET
5. Render will automatically deploy on push to main branch

## API Endpoints

### Authentication
POST /auth/google: Google OAuth callback
POST /auth/logout: Logout user
GET /auth/session: Get current session

### Events
GET /events: Get all events with filtering/pagination
GET /events/<id>: Get specific event details
POST /events: Create new event (authenticated)
PUT /events/<id>: Update event (owner only)
DELETE /events/<id>: Delete event (owner only)
POST /events/<id>/join: Join event (authenticated)
POST /events/<id>/leave: Leave event (authenticated)

### Users
GET /users/<id>: Get user profile
PUT /users/<id>: Update profile (authenticated)
POST /users/<id>/follow: Follow user (authenticated)
POST /users/<id>/unfollow: Unfollow user (authenticated)

## Development

### Code Style
Frontend: ESLint configuration in eslint.config.mjs
Backend: Follow PEP 8 Python style guide

### Running Locally
```bash
npm run dev
```

This runs both frontend and backend concurrently using the setup defined in the root package.json.

## Troubleshooting

### CORS Errors
Ensure FRONTEND_ORIGINS in backend .env includes your frontend URL
For Vercel preview URLs, add pattern: https://hopon-*.vercel.app

### Google OAuth Not Working
Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct and active
Check OAuth redirect URI in Google Cloud Console
Ensure frontend domain is added to authorized JavaScript origins

### Database Connection Issues
For local development: Leave DATABASE_URL empty to use SQLite
For production: Use PostgreSQL connection string from Render

### Port Already in Use
Run npm run cleanup from project root to kill processes on ports 3000 and 8000

## License

This project is part of SE390 at University of Waterloo.

## Deployment

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Connect repository to Vercel dashboard
3. Set NEXT_PUBLIC_API_BASE_URL environment variable
4. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
5. Vercel will automatically deploy on push to main branch

### Deploy Backend to Render

1. Create PostgreSQL database on Render
2. Create new Web Service on Render
3. Connect to GitHub repository
4. Set environment variables in Render dashboard:
   FRONTEND_ORIGINS: https://hopon.vercel.app (and any preview URLs)
   DATABASE_URL: PostgreSQL connection string
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET
5. Render will automatically deploy on push to main branch
