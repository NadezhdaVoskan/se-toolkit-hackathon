# Voice Weekly Planner

Voice Weekly Planner is a student project that turns spoken planning notes into structured weekly tasks.

The project is built as a small monorepo with a Next.js frontend, a FastAPI backend, and PostgreSQL for persistence. It is designed to be simple enough for a university course project while still following a clean service-based structure and a Docker-based local development workflow.

## Project Description

The application focuses on one main flow:

- Record or upload a spoken planning note, transcribe it, extract tasks, and show them in a weekly task list.

Example planning note:

- "I need to finish math homework on Monday and prepare slides on Wednesday."

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Testing: Pytest, Vitest, Testing Library
- Containers: Docker, Docker Compose

## Repository Structure

```text
.
|-- frontend/              # Next.js client application
|-- backend/               # FastAPI API and business logic
|-- docker-compose.yml     # Multi-container local setup
|-- .env.example           # Root Docker/Compose environment variables
`-- README.md
```

### Frontend structure

- `frontend/src/app`
  Next.js app entry files.
- `frontend/src/components`
  Reusable UI components such as cards and task board.
- `frontend/src/lib`
  API utilities and the reusable audio recorder hook.
- `frontend/src/types`
  Shared frontend TypeScript types.

### Backend structure

- `backend/app/api/routes`
  FastAPI route handlers.
- `backend/app/services`
  Transcription, task extraction, and shared upload logic.
- `backend/app/models`
  SQLAlchemy models.
- `backend/app/schemas`
  Pydantic request and response schemas.
- `backend/app/db`
  Database session and SQLAlchemy base.
- `backend/alembic`
  Migration-ready database structure.
- `backend/tests`
  Lightweight backend API tests.

## Architecture

The application uses a straightforward three-layer structure:

1. `Frontend`
   Captures audio, uploads it to the backend, shows transcription results, and renders the weekly task list.

2. `Backend API`
   Receives uploaded audio, validates it, stores data, applies task logic, and exposes REST endpoints.

3. `Database`
   Stores `Task` records and uploaded `VoiceNote` records in PostgreSQL.

### Main data flow

For planning notes:

1. User records audio in the web app.
2. Frontend uploads audio to the backend.
3. Backend validates and temporarily saves the audio file.
4. Backend transcribes the audio.
5. Backend extracts tasks from the transcription.
6. Backend stores the voice note and extracted tasks.
7. Frontend refreshes and displays the weekly task list.

## Current Capabilities

- Record a spoken planning note
- Upload audio to backend
- Transcribe speech to text
- Extract weekly tasks from the transcription
- Save tasks in PostgreSQL
- Display tasks grouped by weekday
- Manually mark tasks as done from the UI

## Setup

### Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 16+ if running without Docker
- Docker Desktop if using Docker Compose

## Environment Variables

There are three example environment files:

- [/.env.example](d:/InnopolisUniversity/software-engineering-toolkit/SpeakPlan/.env.example)
- [/backend/.env.example](d:/InnopolisUniversity/software-engineering-toolkit/SpeakPlan/backend/.env.example)
- [/frontend/.env.example](d:/InnopolisUniversity/software-engineering-toolkit/SpeakPlan/frontend/.env.example)

### Root `.env`

Used by Docker Compose.

| Variable | Purpose | Example |
|---|---|---|
| `POSTGRES_DB` | PostgreSQL database name | `voice_weekly_planner` |
| `POSTGRES_USER` | PostgreSQL username | `planner` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `planner` |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5432` |
| `BACKEND_PORT` | Host port for FastAPI | `8000` |
| `FRONTEND_PORT` | Host port for Next.js | `3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend URL for backend API | `http://localhost:8000` |
| `TRANSCRIPTION_PROVIDER` | Speech-to-text provider mode | `local`, `auto`, or `mock` |
| `WHISPER_API_KEY` | OpenAI API key for real transcription | `your_openai_api_key` |
| `WHISPER_MODEL` | Whisper model name | `whisper-1` |
| `WHISPER_LANGUAGE` | Optional fixed language code for transcription | `en` |
| `WHISPER_API_URL` | Optional custom Whisper endpoint | empty by default |
| `LOCAL_WHISPER_MODEL` | Local faster-whisper model name | `medium` |
| `LOCAL_WHISPER_DEVICE` | Local faster-whisper device | `cpu` |
| `LOCAL_WHISPER_COMPUTE_TYPE` | Local faster-whisper compute type | `int8` |
| `LOCAL_WHISPER_DOWNLOAD_ROOT` | Writable folder for local model downloads | `.cache/faster-whisper` |
| `TASK_EXTRACTION_PROVIDER` | Task extraction provider mode | `auto` or `mock` |
| `LLM_API_KEY` | LLM API key for task extraction | empty by default |
| `LLM_MODEL` | LLM model name | `gpt-4o-mini` |
| `LLM_API_URL` | Optional custom LLM endpoint | empty by default |

### Backend `.env`

Used when running the backend directly without Docker.

| Variable | Purpose |
|---|---|
| `APP_NAME` | FastAPI application title |
| `API_PREFIX` | Base API prefix |
| `DATABASE_URL` | SQLAlchemy database connection string |
| `ALLOWED_ORIGINS` | Allowed CORS origins |
| `TRANSCRIPTION_PROVIDER` | Speech-to-text provider selection |
| `WHISPER_API_KEY` | OpenAI API key for real transcription |
| `WHISPER_MODEL` | Whisper model name |
| `WHISPER_LANGUAGE` | Optional fixed language code such as `en` |
| `WHISPER_API_URL` | Optional custom Whisper URL |
| `LOCAL_WHISPER_MODEL` | Local faster-whisper model name such as `small` or `large-v3` |
| `LOCAL_WHISPER_DEVICE` | Local faster-whisper device such as `auto`, `cpu`, or `cuda` |
| `LOCAL_WHISPER_COMPUTE_TYPE` | Local faster-whisper compute type such as `int8` or `float16` |
| `LOCAL_WHISPER_DOWNLOAD_ROOT` | Writable path for local Whisper model files |
| `TASK_EXTRACTION_PROVIDER` | Task extraction provider selection |
| `LLM_API_KEY` | LLM API key |
| `LLM_MODEL` | LLM model |
| `LLM_API_URL` | Optional custom LLM URL |

### Frontend `.env`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL used by the frontend |

## Running the Project

### Recommended: Docker Compose

1. Copy the root environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

3. Stop all services:

```bash
docker compose down
```

4. Stop services and remove database data:

```bash
docker compose down -v
```

Notes:

- PostgreSQL uses a persistent Docker volume named `postgres_data`.
- The backend waits for PostgreSQL readiness, runs Alembic migrations, and then starts FastAPI.
- The frontend container uses `NEXT_PUBLIC_API_BASE_URL` to connect to the backend.
- The recommended local setup is `TRANSCRIPTION_PROVIDER=local`, which uses `faster-whisper` offline on your machine.
- `TRANSCRIPTION_PROVIDER=auto` uses the OpenAI API only when `WHISPER_API_KEY` is set. Otherwise it falls back to mock transcription.

### Running Without Docker

#### Backend

1. Copy the backend environment file:

```bash
cp backend/.env.example backend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

2. Start the backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

For local offline transcription with `faster-whisper`, first install FFmpeg.

On Windows with Chocolatey:

```powershell
choco install ffmpeg
```

Then use this backend configuration in `backend/.env`:

```env
TRANSCRIPTION_PROVIDER=local
LOCAL_WHISPER_MODEL=medium
LOCAL_WHISPER_DEVICE=cpu
LOCAL_WHISPER_COMPUTE_TYPE=int8
LOCAL_WHISPER_DOWNLOAD_ROOT=.cache/faster-whisper
WHISPER_LANGUAGE=en
```

Then install the optional local transcription package:

```powershell
.\.venv\Scripts\python.exe -m pip install --isolated faster-whisper
```

For better accuracy you can later change `LOCAL_WHISPER_MODEL` to `large-v3` or `large-v3-turbo`.
For most university laptops on Windows, `LOCAL_WHISPER_DEVICE=cpu` is the safest setting.

To use the OpenAI API instead, set these values in `backend/.env`:

```env
TRANSCRIPTION_PROVIDER=auto
WHISPER_API_KEY=your_openai_api_key
WHISPER_MODEL=whisper-1
WHISPER_LANGUAGE=en
```

If `TRANSCRIPTION_PROVIDER=local`, the backend uses local `faster-whisper`.
If `TRANSCRIPTION_PROVIDER=auto` and `WHISPER_API_KEY` is not set, the backend uses mock transcription.

#### Frontend

1. Copy the frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

2. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Usage

### Planning note flow

1. Open the frontend.
2. Record a spoken planning note.
3. Stop recording and upload the audio.
4. Review the transcription result.
5. Review the extracted weekly tasks.
6. Mark tasks as done manually if needed.

## API Endpoint Documentation

Base URL: `/api`

### Health

- `GET /api/health`
  Returns API health status.

### Tasks

- `GET /api/tasks`
  Returns all tasks ordered by newest first.

- `POST /api/tasks`
  Creates a task manually.

  Example request body:

```json
{
  "title": "Finish math homework",
  "description": "Chapter 4 exercises",
  "day_of_week": "Monday",
  "status": "todo"
}
```

- `PATCH /api/tasks/{id}`
  Updates selected task fields such as `status` or `day_of_week`.

- `DELETE /api/tasks/{id}`
  Deletes a task.

### Voice notes

- `POST /api/voice-notes/upload`
  Uploads a planning note audio file, stores transcription text, extracts tasks, and returns the created voice note with extracted tasks.

## Testing

The project includes lightweight tests for the critical flow.

### Backend tests

Covered cases:

- task creation
- task status update
- voice note upload endpoint

Run:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

### Frontend tests

Covered case:

- weekly task board rendering and action button behavior

Run:

```bash
cd frontend
npm install
npm test
```

## Deployment Notes

For submission and demonstration, Docker Compose is the easiest deployment method.

Deployment steps:

1. Create `.env` from [/.env.example](d:/InnopolisUniversity/software-engineering-toolkit/SpeakPlan/.env.example)
2. Run `docker compose up --build -d`
3. Open the frontend on `http://localhost:3000`
4. Open API docs on `http://localhost:8000/docs`

For a simple server deployment later, the same containers can be reused with different environment variable values and host ports.

## Known Limitations

- Local transcription depends on `faster-whisper` and FFmpeg being installed on the machine running the backend.
- OpenAI API transcription depends on a valid `WHISPER_API_KEY` and external OpenAI API availability.
- LLM-based task extraction is still a placeholder and is not yet connected to a real API.
- There is no authentication or per-user data separation.
- The project is designed for a single-user demo scenario.

## Future Improvements

- Add automated tests for both local faster-whisper transcription and OpenAI API transcription.
- Integrate a real LLM for task extraction.
- Add user authentication and user-specific task lists.
- Add more automated tests, especially end-to-end frontend tests.
- Add better task metadata such as due time, priority, and categories.

## What Was Simplified For Submission

- Environment variable naming was made more consistent around `LLM_API_KEY` instead of mixing generic and provider-specific naming.
- The README now documents the system as a single coherent project instead of incremental development notes.

## TA Demonstration Checklist

- Start the full stack with `docker compose up --build`
- Show the homepage and explain the three main UI areas
- Record and upload a planning note
- Show the returned transcription text
- Show extracted tasks grouped by weekday
- Mark one task as done manually
- Show the updated task list after extraction
- Open `http://localhost:8000/docs` and briefly show the documented API endpoints
