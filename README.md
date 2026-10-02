# Code-Snippets

Snippet Studio

This repository contains a Node.js and Express application with account registration, cookie-based sessions, a protected template workspace, and persistent community data. Published templates are stored in one shared catalog and broadcast to signed-in users with the library or dashboard open.

## Requirements

- Node.js 20.12 or newer
- npm

## Run locally

```powershell
npm install
npm start
```

Open the exact local URL printed by the server. It starts on port 3000 and automatically tries the next port if that port is already occupied. Create an account from the Login page. Template-library and dashboard pages require a valid server session.

## Tests

```powershell
npm test
```

## Data and deployment

The first server start creates `data/store.json` and seeds the curated template catalog. Back up that file to preserve accounts and content. Passwords are stored as salted scrypt hashes; session cookies are HttpOnly and SameSite=Lax. Template, review, and follow changes are persisted and sent to connected clients through `/api/events`. Set `NODE_ENV=production` behind HTTPS so cookies use the Secure flag. Configure `PORT` and optionally `DATA_FILE` for the hosting platform.

This app must run on a Node-capable host. Netlify static hosting cannot execute the Express server or enforce its session checks; use a Node host or port the API to serverless functions and a managed database before deploying there. The JSON store is intended for a single app instance; use a transactional database such as PostgreSQL for multi-instance production deployments.
