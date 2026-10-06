# Together Hub

A real-time collaboration platform: shared rich-text documents, a multi-file code workspace, a whiteboard, and video meeting rooms, organised into rooms and teams.

## Features

- **Documents** – TipTap editor synced with Yjs (live cursors, typing indicators).
- **Code workspace** – Monaco editor with a shared file/folder tree; every file syncs live.
- **Whiteboard** – Canvas drawing with live strokes and cursors from collaborators.
- **Meeting rooms** – WebRTC video/audio, screen sharing and chat.
- **Rooms & teams** – Public/private rooms, email invites, team roles.
- **Auth** – Email/password, plus optional Google and GitHub sign-in.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS, React Router, TipTap, Monaco, Yjs |
| Backend | Node.js, Express 5, Mongoose (MongoDB), Socket.io, JWT |
| Real-time sync | Hocuspocus (Yjs) server, state persisted to MongoDB |

## Architecture

The backend starts two servers from one process:

| Service | Default port | Purpose |
|---|---|---|
| REST API + Socket.io | `5000` | Auth, rooms, teams, documents; WebRTC signalling and meeting chat |
| Hocuspocus | `1234` | Yjs sync for documents, code and whiteboards |

The frontend dev server runs on port `3000`.

## Prerequisites

- Node.js 20 or newer
- MongoDB running locally (or a MongoDB Atlas connection string)

## Getting started

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# then set JWT_SECRET in backend/.env to a long random string

# 3. (Optional) create the demo account used by "Use Demo Credentials" on the login page
cd backend && npm run seed:demo

# 4. Start the backend (API + collaboration server)
cd backend && npm run dev

# 5. In a second terminal, start the frontend
cd frontend && npm run dev
```

Open http://localhost:3000.

### macOS: port 5000 is taken

macOS uses port 5000 for the AirPlay Receiver. Either turn it off (System Settings → General → AirDrop & Handoff → AirPlay Receiver) or move the API to another port, for example `5050`:

- `backend/.env`: `PORT=5050`, and update `GOOGLE_CALLBACK_URL` / `GITHUB_CALLBACK_URL`
- `frontend/.env`: `VITE_SERVER_URL=http://localhost:5050` and `VITE_API_URL=http://localhost:5050/api`

## Environment variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend URL, used for CORS and OAuth redirects (default `http://localhost:3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens — **must be set** |
| `COLLAB_PORT` / `COLLAB_HOST` | Hocuspocus server port and bind address |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Optional Google sign-in |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` | Optional GitHub sign-in |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_SERVER_URL` | Backend base URL (Socket.io) |
| `VITE_API_URL` | REST API base URL |
| `VITE_COLLAB_URL` | Hocuspocus WebSocket URL |

## Scripts

| Location | Command | What it does |
|---|---|---|
| `backend` | `npm run dev` | Start API + collaboration server with auto-reload |
| `backend` | `npm start` | Start without auto-reload |
| `backend` | `npm run seed:demo` | Create the demo user |
| `backend` | `npm run migrate:room-workspaces` | Link existing rooms to their workspace documents |
| `frontend` | `npm run dev` | Start the Vite dev server |
| `frontend` | `npm run build` | Production build into `frontend/dist` |
| `frontend` | `npm run preview` | Serve the production build locally |

## Project structure

```
backend/
  server.js               Express app, Socket.io (meetings), starts both servers
  collaborationServer.js  Hocuspocus server + MongoDB persistence
  controllers/ routes/ models/ middleware/ utils/
frontend/src/
  pages/                  Dashboard, rooms, team, and the four workspace editors
  components/             Layout and UI components
  contexts/               Auth, theme, notifications
  services/api.js         Axios API client
  utils/                  Code-workspace, whiteboard and Monaco helpers
```

## Known limitations

This project is under active development. Current gaps:

- The collaboration server does not yet check who is connecting; anyone with a workspace link can edit it.
- Private rooms' workspaces cannot be opened yet.
- Team roles (editor/viewer) are not enforced on rooms or workspaces.
- Some dashboard widgets (search, activity feed, presence avatars) still show placeholder data.
- Video calls use a peer-to-peer mesh with public STUN servers only, so they suit small groups and may fail behind strict firewalls.
- There is no automated test suite yet.
