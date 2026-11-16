# Xander chat

Modern, responsive Next.js chat UI for the FastAPI/LangGraph agent in this repository.

## Run locally

In one terminal, start the FastAPI server from the repository root:

```powershell
uv run fastapi dev
```

In another terminal, start the frontend:

```powershell
cd frontend
npm run dev
```

Open http://localhost:3000. The Next.js dev server proxies `/api/*` to `http://localhost:8000/*`, so the browser can call the backend without separate CORS configuration. To use another backend address, set `BACKEND_URL` before starting Next.js, for example:

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8000"
npm run dev
```

Chat turns use `POST /ai/chat` with `{ "query": "...", "session_id": "..." }`. History loads from `GET /ai/history?session_id=...`. Session IDs and the recent conversation list are stored in the browser's local storage; message content remains in the FastAPI backend.
