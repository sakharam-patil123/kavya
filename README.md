# KavyaLearn — root README

This repository contains a frontend (Vite/React) and backend (Express/MongoDB).

How to build & start locally (root):

- Build frontend and start backend:

```bash
npm start
```

This runs `start.sh`, which builds `frontend` and starts the backend server (`backend/server.js`).

Notes:
- `package.json` at project root sets `engines.node: 18.x` to help deployments select a Node runtime.
- `Procfile` contains `web: npm start` for platforms that use a Procfile.

Security note: do not commit sensitive credentials to Git; use environment variables or the platform's secret management.
