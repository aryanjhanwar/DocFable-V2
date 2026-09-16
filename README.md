# DocFable

DocFable is an AI-powered PDF research assistant. Users upload a PDF, ask questions about it, generate summaries, create flashcards and quizzes, and extract structured insights.

## 🔗 Live Demo

| Service | URL |
|---|---|
| **Frontend (app)** | [https://docfable-frontend.onrender.com](https://docfable-frontend.onrender.com) |
| **Backend (API)** | [https://docfable-backend.onrender.com](https://docfable-backend.onrender.com) |
| **Backend health check** | [https://docfable-backend.onrender.com/api/health](https://docfable-backend.onrender.com/api/health) |

> Hosted on Render's free tier — if a service has been idle, the first request can take 30–60 seconds while it wakes up.

The application has two services:

- **Frontend:** React, Vite, Tailwind CSS, and React Router
- **Backend:** Python, FastAPI, PDF parsing, and streaming AI responses (SSE)

## Table of Contents

- [What the Application Does](#what-the-application-does)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Docker (Local)](#docker-local)
- [Deploying to Render](#deploying-to-render)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

## What the Application Does

DocFable converts an uploaded PDF into a temporary document session. The extracted text is then used as context for several AI tools:

1. **Chat:** Ask questions about the document.
2. **Summary:** Generate executive, beginner-friendly, technical, or bullet-point summaries.
3. **Flashcards:** Generate interactive question-and-answer study cards.
4. **Quiz:** Generate multiple-choice or short-answer questions.
5. **Insights:** Extract contributions, strengths, limitations, future scope, statistics, and terminology.

Responses stream token-by-token using Server-Sent Events (SSE), so text appears as it's generated rather than all at once.

## Project Structure

```text
DocFable-V2/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── store.py
│       ├── routers/
│       │   ├── health.py
│       │   ├── upload.py
│       │   └── chat.py
│       └── utils/
│           ├── pdf_parser.py
│           └── prompt_builder.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        ├── hooks/
        ├── pages/
        └── services/
            └── api.js
```

## Local Development

### Prerequisites

- Node.js 20 or newer
- Python 3.12 or newer
- An OpenRouter or Gemini API key

### Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

The backend runs at:

```text
http://localhost:5000
```

### Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

Vite proxies `/api` requests to the backend during local development.

### Production frontend build

```bash
cd frontend
npm run build
npm run preview
```

## Docker (Local)

Build and start both services from the project root:

```bash
docker compose up --build
```

The application is then available at:

```text
http://localhost:3000
```

The frontend container builds the React app and serves it with Nginx. Nginx proxies `/api` requests to the backend container and disables proxy buffering so SSE responses remain real-time.

## Deploying to Render

Render deploys the frontend and backend as **two separate services** with two separate URLs, so a few settings differ from local Docker.

### 1. Push to GitHub

Render deploys from a connected Git repository, not a zip upload. Push this project to a GitHub repo first.

### 2. Backend — Web Service

- **New → Web Service**, connect the repo
- Root Directory: `backend`
- Environment: **Docker** (uses `backend/Dockerfile`)
- Environment variables:
  - `OPENROUTER_API_KEY` (or `GEMINI_API_KEY`)
  - `OPENROUTER_MODEL` (optional)
  - `GEMINI_MODEL` (optional)
  - `PORT=5000`
  - `FRONTEND_URL` — set this after step 3, to the frontend's Render URL
- Copy the resulting URL, e.g. `https://docfable-backend.onrender.com`

> **Note:** `backend/Dockerfile` runs a single Uvicorn worker (`--workers 1`). The session store is a plain in-memory Python dict, so running multiple worker processes causes uploads and chat/summary/flashcard requests to land on different processes that don't share memory — resulting in false "session expired" errors immediately after upload. Keep this at 1 worker unless the store is moved to a shared backend like Redis.

### 3. Frontend — Static Site

- **New → Static Site**, same repo
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment variable:
  - `VITE_API_URL` — the backend URL + `/api`, e.g. `https://docfable-backend.onrender.com/api`

> **Note:** `frontend/src/services/api.js` reads `VITE_API_URL` at build time (`import.meta.env.VITE_API_URL || '/api'`). The relative `/api` default only works with the local Nginx proxy — on Render, frontend and backend are on different domains, so this variable is required.

### 4. Close the CORS loop

Go back to the backend service, set `FRONTEND_URL` to the frontend's Static Site URL, and redeploy the backend so CORS allows requests from it.

### 5. Test

Open the frontend URL, upload a PDF, and try chat/summary/flashcards/quiz/insights.

Render's free tier spins services down after inactivity, so the first request after idling can take 30–60 seconds while the backend wakes up. This is expected and not a bug.

## Environment Variables

Create `backend/.env` from `backend/.env.example` for local development:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development

# Recommended provider
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free

# Fallback provider
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash-lite
```

Provider selection is:

1. OpenRouter when `OPENROUTER_API_KEY` is valid.
2. Gemini when only `GEMINI_API_KEY` is valid.
3. HTTP 503 when neither provider is configured.

Frontend (`frontend`, build-time only):

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

Leave `VITE_API_URL` unset for local development — it falls back to `/api`, which Vite/Nginx proxy to the backend.

## API Endpoints

### Health check

```http
GET /api/health
```

### Upload a PDF

```http
POST /api/upload
Content-Type: multipart/form-data
```

Form field: `pdf=<PDF file>`

Example response:

```json
{
  "sessionId": "generated-uuid",
  "filename": "paper.pdf",
  "pageCount": 12,
  "wordCount": 8400,
  "charCount": 51000,
  "truncated": false,
  "message": "PDF uploaded and parsed successfully"
}
```

### Get session metadata

```http
GET /api/upload/:sessionId
```

### Generate an AI response

```http
POST /api/chat
Content-Type: application/json
```

Supported modes: `chat`, `summary`, `flashcards`, `quiz`, `insights`. The response is a Server-Sent Events stream, not a single JSON payload.

Example (chat):

```json
{
  "sessionId": "generated-uuid",
  "mode": "chat",
  "question": "What problem does this paper solve?"
}
```

## Known Limitations

- Documents are stored only in memory and disappear when the backend restarts or redeploys.
- Sessions expire after approximately two hours of inactivity.
- Scanned or image-only PDFs are not processed with OCR.
- Large PDFs are truncated before being sent to the AI model (~300,000 characters on upload, ~250,000 on prompt construction).
- Flashcards and MCQs depend on the AI following the exact format requested by the prompt.
- Running the backend with more than one worker process breaks session lookups, since the in-memory store isn't shared across processes.

## Troubleshooting

**"Your session id is expired, please upload PDF again" right after uploading**
The backend is running more than one worker process, or it restarted/redeployed between the upload and the next request. Confirm `backend/Dockerfile` uses `--workers 1`, and re-upload after any backend redeploy.

**Frontend loads but every request fails or hangs**
Check that `VITE_API_URL` was set *before* the frontend was built (Vite bakes it in at build time — changing the env var requires a rebuild, not just a restart). Also confirm the backend's `FRONTEND_URL` matches the frontend's exact URL (scheme and no trailing slash).

**First request after some idle time is very slow**
Expected on Render's free tier — the service spins down when idle and takes 30–60 seconds to wake up on the next request.

**Build fails with "Publish directory dist does not exist"**
The Static Site's Build Command is empty or wrong. It must be `npm install && npm run build`.
