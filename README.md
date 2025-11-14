# HopOn - Find Pickup Games Nearby

A web application that helps sports enthusiasts discover and participate in local pickup games. Connect with players, find games near you, and never miss an opportunity to play.

**Live Demo:** https://hopon.vercel.app

---

## Features

- 🏃 **Discover Games** - Find pickup games and sports events near your location
- 👥 **Connect with Players** - Browse player profiles and build your sports network
- 📍 **Location-Based Search** - Find games happening nearby with real-time distance calculations
- 🎮 **Create Events** - Host your own pickup games and invite players
- 🔐 **Google OAuth Authentication** - Secure login with Google
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui
- **State Management:** React Context API
- **Authentication:** Google OAuth 2.0

### Backend
- **Framework:** Flask (Python)
- **Database:** PostgreSQL
- **Authentication:** JWT tokens
- **API:** RESTful with real-time WebSocket support

### Deployment
- **Frontend:** Vercel (https://vercel.com)
- **Backend:** Render (https://render.com)
- **Database:** PostgreSQL on Render

---

## Project Structure

```
hopon/
├── backend/
│   ├── app.py                 # Flask application with all routes
│   ├── models.py              # SQLAlchemy ORM models
│   ├── pyproject.toml         # Python dependencies and project config
│   ├── uv.lock                # Locked dependency versions
│   ├── .env.example           # Environment variables template
│   ├── Dockerfile             # Container configuration for Render
│   └── instance/              # Instance folder for local database
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js app router pages
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── home/          # Main app with sidebar layout
│   │   │   ├── create/        # Create new event
│   │   │   ├── discover/      # Browse all games
│   │   │   ├── events/        # User's events (joined/hosted)
│   │   │   └── profile/       # User profile
│   │   ├── components/        # Reusable React components
│   │   │   └── ui/            # Shadcn UI components
│   │   ├── context/           # React Context for auth state
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/
│   │       ├── api.ts         # API client functions
│   │       ├── utils.ts       # Utility functions
│   │       └── fallback-data.ts  # Development fallback data
│   ├── public/                # Static assets (logo.png)
│   ├── package.json           # Frontend dependencies
│   ├── pnpm-lock.yaml         # Locked npm dependency versions
│   ├── next.config.ts         # Next.js configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── Dockerfile             # Container configuration for Vercel
│   └── postcss.config.mjs      # PostCSS & Tailwind configuration
│
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
└── .github/                   # GitHub configuration files
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- pnpm (recommended) or npm

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Create .env.local file with backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
pnpm dev
```

Open http://localhost:3000 in your browser.

### Backend Setup

```bash
cd backend

# Install dependencies (using uv)
# If you don't have uv installed: pip install uv
uv sync

# Create .env file with required variables
cp .env.example .env
# Edit .env with your values:
# - FRONTEND_ORIGINS: http://localhost:3000
# - GOOGLE_CLIENT_ID: your Google OAuth client ID
# - GOOGLE_CLIENT_SECRET: your Google OAuth client secret
# - DATABASE_URL: (leave empty for local SQLite, or use PostgreSQL URL)

# Run database migrations
uv run python -m flask db upgrade

# Start development server
uv run python app.py
```

The API will be available at http://localhost:8000.

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=https://hopon-backend.onrender.com
```

### Backend (`.env`)
See `backend/.env.example` for all required variables:
- `FRONTEND_ORIGINS`: Comma-separated list of allowed frontend URLs
- `GOOGLE_CLIENT_ID`: Google OAuth application ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth application secret
- `DATABASE_URL`: PostgreSQL connection string (production only)

---

## Deployment

### Deploy Frontend to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel automatically deploys on push to main branch

### Deploy Backend to Render
1. Create PostgreSQL database on Render
2. Create new Web Service on Render
3. Connect to GitHub repository
4. Set environment variables (including DATABASE_URL)
5. Render automatically deploys on push to main branch

---

## API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth callback
- `POST /auth/logout` - Logout user

### Events
- `GET /events` - Get all events with filtering/pagination
- `GET /events/<id>` - Get specific event details
- `POST /events` - Create new event (authenticated)
- `PUT /events/<id>` - Update event (owner only)
- `DELETE /events/<id>` - Delete event (owner only)

### Players
- `GET /players` - Get all players
- `GET /players/<id>` - Get player profile
- `PUT /players/<id>` - Update profile (authenticated)

### Participation
- `POST /events/<id>/join` - Join event (authenticated)
- `POST /events/<id>/leave` - Leave event (authenticated)

---

## Development

### Code Style
- Frontend: ESLint configured in `eslint.config.mjs`
- Backend: Follow PEP 8 Python style guide

### Database Migrations
```bash
# Backend: Generate and apply migrations
cd backend
uv run flask db migrate
uv run flask db upgrade
```

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_ORIGINS` in backend `.env` includes your frontend URL
- For Vercel preview URLs, use regex: `https://hopon-[a-z0-9]+-.*\.vercel\.app`

### Google OAuth Not Working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check OAuth redirect URI in Google Cloud Console matches backend

### Database Connection Issues
- For local dev: Leave `DATABASE_URL` empty (uses SQLite)
- For production: Use PostgreSQL connection string from Render

---

## License

This project is part of SE390 at University of Waterloo.

---

## Support

For issues or questions, please create an issue on GitHub or contact the development team.
