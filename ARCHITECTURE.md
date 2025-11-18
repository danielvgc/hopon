# HopOn Architecture Guide

This document describes how the HopOn application is structured, including authentication flows, state management, APIs, and key features.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Session Persistence](#session-persistence)
4. [Frontend State Management](#frontend-state-management)
5. [API Client](#api-client)
6. [Backend API Endpoints](#backend-api-endpoints)
7. [Database Models](#database-models)
8. [Google Maps Integration](#google-maps-integration)
9. [Progressive Web App (PWA)](#progressive-web-app-pwa)
10. [Key Implementation Details](#key-implementation-details)

## Overview

HopOn is a full-stack application for discovering and participating in local pickup sports games. It uses:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, and React Context for state management
- **Backend**: Flask with SQLAlchemy ORM and JWT authentication
- **Database**: PostgreSQL in production, SQLite for local development
- **Deployment**: Vercel for frontend, Render for backend

The application is a monorepo with separate `frontend/` and `backend/` directories.

## Authentication

HopOn supports two authentication methods:

### Google OAuth 2.0

**Flow:**

1. User clicks "Sign in with Google" button on frontend
2. Frontend opens a popup window to backend's `/auth/google` endpoint
3. Backend redirects to Google's OAuth consent screen
4. User authorizes the application
5. Google redirects back to backend with authorization code
6. Backend exchanges the code for Google tokens
7. Backend creates or updates the user in the database
8. Backend generates a JWT access token and refresh token
9. Backend returns user data and access token to the popup
10. Popup communicates with main window via `postMessage()` (same-origin communication)
11. Main window receives the payload and stores the access token

**Files Involved:**
- Frontend: `src/context/auth-context.tsx` (handles popup communication)
- Backend: `app.py` (lines ~400-500, `/auth/google` endpoint)

**Key Details:**
- Google Client ID and Secret from environment variables
- Popup window communication requires same-origin (both on same domain)
- Backend stores user in `user_model` table with Google ID
- Backend issues JWT tokens separate from Google tokens

### Email/Password Authentication

**Flow:**

1. User submits email and password to frontend signup/login form
2. Frontend sends credentials to backend `/auth/signup` or `/auth/login`
3. Backend validates credentials (password hashed with bcrypt)
4. Backend creates user or validates existing user
5. Backend generates JWT access token and refresh token
6. Frontend stores access token in localStorage

**Files Involved:**
- Frontend: `src/app/login/page.tsx`, `src/app/signup/page.tsx`
- Backend: `app.py` (lines ~300-380, `/auth/signup` and `/auth/login` endpoints)

### Token Structure

**Access Token (JWT):**
- Format: `header.payload.signature` (HS256 algorithm)
- Contents: User ID, username, email, issued time, expiration time
- TTL: 24 hours (configured in `JWT_ACCESS_EXPIRES`)
- Storage: localStorage with key `hopon_access_token`
- Sent with requests: `Authorization: Bearer {token}`
- Cleared: User must log out or token expires

**Refresh Token:**
- Format: HTTP-only cookie (cannot be accessed by JavaScript)
- TTL: 7 days
- Storage: Browser cookie storage (automatic)
- Usage: When access token expires (401 response), frontend can request a new access token via `/auth/refresh` endpoint
- Cleared: Backend sets `max_age=0` on logout

## Session Persistence

Session persistence allows users to remain logged in across page reloads and browser tabs. This required careful synchronization between localStorage, React state, and the API client.

### On Page Load

1. **API Module Initialization** (`src/lib/api.ts`):
   - Loads stored access token from localStorage
   - Stores token in module-level `accessToken` variable

2. **Auth Context Mount** (`src/context/auth-context.tsx`):
   - Sets `status` to "loading"
   - Uses `isInitialMount` ref to prevent syncing null token on first render
   - This prevents accidental clearing of stored token during React strict mode

3. **Session Restore Effect**:
   - Calls `/auth/session` endpoint with stored token in Authorization header
   - Backend validates token and returns user data if valid
   - Frontend receives user data and updates React state
   - Status changes to "authenticated"
   - If token invalid or expired, status becomes "guest"

### Token Synchronization

**Flow:**
```
API Module loads token from localStorage
         ↓
setAccessToken() is called (e.g., during login)
         ↓
Token saved to localStorage immediately
         ↓
React state is updated (setToken)
         ↓
Components re-render with new user data
```

**Critical Implementation:**
- `setAccessToken(token)` saves to both localStorage AND module-level variable synchronously
- This ensures token is persisted before any state update or navigation
- Module-level variable is used for building request headers (faster than reading localStorage for every request)

### Why This Works

- localStorage persists across page reloads and browser tabs
- Refresh token cookie is sent automatically with requests (browser handles this)
- When access token expires (401), unauthorized handler requests new token via refresh_token cookie
- Session endpoint checks only the Authorization header (no fallback to refresh token)

## Frontend State Management

The application uses React Context API for global state management, centered around the `AuthContext`.

### AuthContext Structure

**Location:** `src/context/auth-context.tsx`

**State Variables:**
- `status`: "loading" (checking auth), "authenticated" (logged in), or "guest" (not logged in)
- `user`: Current user object or null
- `token`: Current JWT access token
- `guestName`: For anonymous users (optional feature)
- `guestTokens`: Stores guest tokens for individual events

**Available Functions:**
- `login(email, password)`: Email/password login
- `signup(email, password, username)`: Create new user account
- `loginWithGoogle()`: Initiate Google OAuth flow
- `logout()`: Log out and clear session
- `loginAsDemo(opts)`: Demo login for testing

**Usage in Components:**

```typescript
import { useAuth } from '@/context/auth-context';

export default function ProfilePage() {
  const { status, user, logout } = useAuth();
  
  if (status === 'loading') return <Spinner />;
  if (status === 'guest') return redirect('/login');
  
  return <div>{user.username}</div>;
}
```

### useAuth Hook

**Location:** Exported from `src/context/auth-context.tsx`

Simple wrapper to access AuthContext with error handling:

```typescript
function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## API Client

The API client is centralized in `src/lib/api.ts` and handles all communication with the backend.

### Key Features

1. **Automatic Token Management:**
   - Reads token from localStorage on initialization
   - Includes token in `Authorization` header for all requests
   - Handles token refresh on 401 responses

2. **Error Handling:**
   - Throws descriptive errors with status codes
   - Supports retry logic for certain endpoints

3. **Request Formatting:**
   - Automatically sets `Content-Type: application/json`
   - Includes `credentials: "include"` for cookie sending
   - Handles both JSON and FormData requests

4. **Console Logging:**
   - Logs token operations for debugging
   - Logs request status (with/without token)

### API Object Methods

**Authentication:**
```typescript
Api.session()           // GET /auth/session
Api.login(email, pwd)   // POST /auth/login
Api.signup(email, pwd)  // POST /auth/signup
Api.logout()            // POST /auth/logout
Api.googleLogin(code)   // POST /auth/google
```

**Events:**
```typescript
Api.getEvents(filters)           // GET /events
Api.getEventById(id)             // GET /events/<id>
Api.createEvent(eventData)       // POST /events
Api.updateEvent(id, eventData)   // PUT /events/<id>
Api.deleteEvent(id)              // DELETE /events/<id>
Api.joinEvent(eventId)           // POST /events/<id>/join
Api.leaveEvent(eventId)          // POST /events/<id>/leave
```

**Users:**
```typescript
Api.getUserProfile(userId)       // GET /users/<id>
Api.updateUserProfile(userData)  // PUT /users/<id>
Api.followUser(userId)           // POST /users/<id>/follow
Api.unfollowUser(userId)         // POST /users/<id>/unfollow
```

## Backend API Endpoints

All endpoints require `Content-Type: application/json` unless otherwise specified.

### Authentication Endpoints

**POST /auth/signup**
- Description: Create a new user account
- Request: `{ email, password, username }`
- Response: `{ user, access_token, refresh_token }`
- Status: 200 (success), 400 (validation error), 409 (email exists)

**POST /auth/login**
- Description: Log in with email and password
- Request: `{ email, password }`
- Response: `{ user, access_token }`
- Status: 200 (success), 401 (invalid credentials)

**POST /auth/google**
- Description: Google OAuth callback (called by OAuth flow)
- Request: `{ code }`
- Response: `{ user, access_token }` (sent to popup)
- Status: 200 (success), 400 (invalid code)

**GET /auth/session**
- Description: Check if user is authenticated and get current user
- Headers: Authorization header with token (if logged in)
- Response: `{ authenticated: true/false, user?, access_token? }`
- Status: 200 (always success, check `authenticated` field)
- Notes: Used on app startup to restore session

**POST /auth/logout**
- Description: Log out user
- Request: Empty body
- Response: `{ message: "Logged out" }`
- Status: 200 (success)
- Side effects: Clears refresh_token cookie on backend

**POST /auth/refresh**
- Description: Get new access token using refresh token cookie
- Request: Empty body (refresh token sent via cookie)
- Response: `{ access_token }`
- Status: 200 (success), 401 (refresh token expired/invalid)

### Events Endpoints

**GET /events**
- Description: Get all events with optional filtering
- Query Parameters:
  - `sport`: Filter by sport type
  - `latitude`, `longitude`: User location for distance calculation
  - `distance_km`: Search radius in kilometers
  - `page`: Pagination page number
- Response: `{ events: [...], total_count, page }`
- Notes: Distance calculated server-side using Haversine formula

**GET /events/<id>**
- Description: Get single event details
- Response: `{ id, name, sport, location, latitude, longitude, host, participants: [...] }`
- Status: 200 (success), 404 (not found)

**POST /events**
- Description: Create new event (authenticated required)
- Headers: Authorization header
- Request: `{ name, sport, location, latitude, longitude, max_players, event_date?, notes? }`
- Response: `{ id, name, ... }`
- Status: 201 (created), 401 (unauthorized), 400 (validation error)

**PUT /events/<id>**
- Description: Update event (owner only)
- Headers: Authorization header
- Request: `{ name?, sport?, location?, ... }`
- Response: `{ id, name, ... }`
- Status: 200 (success), 401 (unauthorized), 403 (not owner), 404 (not found)

**DELETE /events/<id>**
- Description: Delete event (owner only)
- Headers: Authorization header
- Status: 204 (success), 401 (unauthorized), 403 (not owner), 404 (not found)

**POST /events/<id>/join**
- Description: Join an event (authenticated required)
- Headers: Authorization header
- Request: Empty body
- Response: `{ message: "Joined event" }`
- Status: 200 (success), 401 (unauthorized), 404 (not found), 409 (already joined)

**POST /events/<id>/leave**
- Description: Leave an event (authenticated required)
- Headers: Authorization header
- Status: 200 (success), 401 (unauthorized), 404 (not found), 409 (not joined)

### Users Endpoints

**GET /users/<id>**
- Description: Get user profile
- Response: `{ id, username, bio, location, latitude, longitude, sports, eventsCount, isFollowing }`
- Status: 200 (success), 404 (not found)

**PUT /users/<id>**
- Description: Update user profile (authenticated, own profile only)
- Headers: Authorization header
- Request: `{ username?, bio?, location?, latitude?, longitude?, sports?, gender? }`
- Response: `{ id, username, ... }`
- Status: 200 (success), 401 (unauthorized), 403 (not own profile), 404 (not found)

**POST /users/<id>/follow**
- Description: Follow a user (authenticated required)
- Headers: Authorization header
- Status: 200 (success), 401 (unauthorized), 404 (not found)

**POST /users/<id>/unfollow**
- Description: Unfollow a user (authenticated required)
- Headers: Authorization header
- Status: 200 (success), 401 (unauthorized), 404 (not found)

## Database Models

### User Model

```python
class User(db.Model):
    __tablename__ = 'user_model'
    
    id: int (Primary Key)
    username: str (unique)
    email: str (unique)
    password_hash: str
    bio: str (optional)
    gender: str (optional)
    location: str (optional)
    latitude: float (optional)
    longitude: float (optional)
    sports: JSON array (optional) - e.g., ["basketball", "tennis"]
    avatar_url: str (optional)
    google_id: str (optional, for OAuth)
    created_at: datetime
    
    Relationships:
    - events (one-to-many): Events hosted by this user
    - event_participants (many-to-many): Events user has joined
    - followers (many-to-many): Users following this user
    - following (many-to-many): Users this user follows
```

### Event Model

```python
class Event(db.Model):
    __tablename__ = 'events'
    
    id: int (Primary Key)
    name: str
    sport: str
    location: str
    latitude: float (optional)
    longitude: float (optional)
    notes: str (optional)
    max_players: int
    host_user_id: int (Foreign Key to User)
    event_date: datetime (optional)
    created_at: datetime
    updated_at: datetime
    
    Relationships:
    - host (many-to-one): User who created the event
    - participants (many-to-many): Users who joined the event
```

### EventParticipant Model (Join Table)

```python
class EventParticipant(db.Model):
    __tablename__ = 'event_participants'
    
    id: int (Primary Key)
    event_id: int (Foreign Key to Event)
    user_id: int (Foreign Key to User)
    joined_at: datetime
```

### Follow Model (Join Table)

```python
class Follow(db.Model):
    __tablename__ = 'follows'
    
    id: int (Primary Key)
    follower_id: int (Foreign Key to User)
    following_id: int (Foreign Key to User)
    created_at: datetime
```

## Google Maps Integration

HopOn uses Google Maps API to display events and user locations on an interactive map.

### Setup

1. **API Key Configuration:**
   - Obtain Google Maps API key from Google Cloud Console
   - Enable: Maps JavaScript API, Places API
   - Add restrictions for web applications (optional but recommended)
   - Store key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable

2. **Script Loading:**
   - Maps script lazy-loaded via `src/lib/google-maps-loader.ts`
   - Loaded when first map component mounts
   - Only loaded once per page load

### Components

**MapDisplay Component** (`src/components/map-display.tsx`):
- Displays interactive map
- Shows event markers with Advanced Marker Element (latest Google Maps API)
- Shows user's current location (blue circle)
- Supports dragging, zooming, panning
- Includes recenter button to pan back to user location
- Mobile-optimized with single-finger drag support

**LocationPicker Component** (`src/components/location-picker.tsx`):
- Allows users to select location for events
- Uses Google Places Autocomplete API
- Updates map when location is selected
- Returns latitude, longitude, and address string

### Distance Calculation

- Backend: Uses Haversine formula to calculate great-circle distance between two points
- Frontend: Distance displayed on event cards and in event details
- Used for: Filtering nearby events, sorting by distance

### Data Flow

```
User visits home page
         ↓
MapDisplay component mounts
         ↓
Google Maps script is lazy-loaded
         ↓
Events fetched from backend with user's coordinates
         ↓
Distance calculated server-side (Haversine formula)
         ↓
Markers placed on map at event coordinates
         ↓
Blue circle placed at user's coordinates
         ↓
User can click markers, drag map, use recenter button
```

## Progressive Web App (PWA)

HopOn is built as a Progressive Web App, allowing it to work offline and be installed on user devices.

### What is a PWA?

A Progressive Web App is a web application that:
- Works on any device with a modern browser
- Can be installed on home screen like a native app
- Works offline or with poor network connectivity
- Provides app-like experience with full-screen mode
- Has fast performance and smooth animations

### HopOn PWA Features

**Service Worker** (`public/sw.js`):
- Registered automatically on app startup
- Network-first strategy for HTML pages (always fetch fresh, fallback to cache)
- Cache-first strategy for static assets (CSS, JavaScript, images)
- Caches assets in `hopon-v3` cache with versioning
- Enables offline functionality

**Installation** (`src/components/pwa-installer.tsx`):
- Listens for `beforeinstallprompt` event (browser-provided install banner)
- Logs installation events
- Can be used to show custom install UI (e.g., "Install HopOn" button)

**Manifest** (`public/manifest.json`):
- Defines app metadata (name, description, icons)
- Specifies display mode: "standalone" (full-screen without browser UI)
- Sets app theme colors (dark background, red accent)
- Defines available icon sizes (maskable icons support adaptive icons)

### How to Install

Users can install HopOn on their devices:

1. **Desktop (Chrome):**
   - Click address bar icon that says "Install HopOn"
   - Or click menu icon → "Install app"

2. **Mobile (iOS Safari):**
   - Tap Share button
   - Select "Add to Home Screen"

3. **Mobile (Android Chrome):**
   - Browser shows install banner automatically
   - Or tap menu icon → "Install app"

Once installed, HopOn opens in full-screen mode without browser UI, works offline, and appears on home screen.

### Benefits

- Users can access app without opening browser
- Works with poor or no internet connectivity
- Faster load times due to caching
- Native app-like experience
- Reduces friction for repeated usage

## Key Implementation Details

### Console Logging for Debugging

The application includes extensive console logging with prefixes for easy filtering:

- `[AuthContext]`: Authentication state changes and session restore
- `[API]`: API requests, token management, authorization
- `[Profile]`: Profile page specific logs
- `[TopNav]`: Navigation related logs
- `[PWA]`: Service Worker and installation logs

**Usage:** Open browser DevTools (F12), go to Console tab, and filter by prefix to debug specific areas.

### Error Handling

- **Frontend**: Try-catch blocks in async functions, error messages shown to users
- **Backend**: Standard HTTP status codes (400 validation, 401 unauthorized, 403 forbidden, 404 not found, 500 server error)
- **Network**: API client retries on 401 with token refresh before failing

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
```

**Backend (.env):**
```
DATABASE_URL=              # Leave empty for local SQLite
GOOGLE_CLIENT_ID=          # From Google Cloud Console
GOOGLE_CLIENT_SECRET=      # From Google Cloud Console
JWT_SECRET=                # Random secure string
JWT_ACCESS_EXPIRES=86400   # 24 hours in seconds
FRONTEND_ORIGINS=http://localhost:3000,https://hopon.vercel.app
SESSION_COOKIE_SECURE=false  # Set true in production with HTTPS
SESSION_COOKIE_SAMESITE=Lax
```

### Development Server

Run both frontend and backend with single command:

```bash
npm run dev
```

This uses `concurrently` to run:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Testing Session Persistence

To verify session persistence is working:

1. Log in with any user
2. Refresh the page (Ctrl+R or Cmd+R)
3. Check that:
   - Status remains "authenticated"
   - User data is loaded
   - You remain on the app (not redirected to login)
4. Open a new tab to the app
5. Verify you're already logged in without needing to log in again

### Mobile and Responsive Design

- Sidebar collapses on mobile devices
- Uses Tailwind CSS responsive utilities
- Touch-friendly buttons and inputs
- Map gestures optimized for mobile (single-finger drag)
- All pages tested on iPhone and Android devices
