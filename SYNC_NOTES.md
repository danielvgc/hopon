Backend / Frontend sync notes

What I changed
- Backend `app.py` now accepts `FRONTEND_ORIGINS` (comma-separated) and uses it for CORS.
- OAuth login stores a validated frontend origin (from the `next` param) and the callback posts the authentication payload to that origin.
- Added `backend/.env.example` and `frontend/.env.example` to show the required environment variables.

Important developer notes
- Set `NEXT_PUBLIC_API_BASE_URL` in the frontend to the backend origin (e.g. `http://localhost:8000`).
- Set `FRONTEND_ORIGINS` in the backend to a comma-separated list of allowed frontend origins (e.g. `http://localhost:3000,http://127.0.0.1:3000`).
- For the cookie-based refresh flow to work across origins in browsers, cookies must be set with `SameSite=None` and `Secure=true` (requires HTTPS). During local development on `http://`, the browser may reject cross-site cookies; you can run the frontend and backend on the same origin or use a local HTTPS proxy if needed.

Next steps I can do for you (pick any):
- Add a small check to the frontend to show a clear message if cookies are blocked (helps debugging session refresh failures).
- Implement a modal guest-name flow (replace `window.prompt`) in the frontend.
- Run static checks/build and fix any TypeScript/lint errors.
