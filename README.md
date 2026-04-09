# SpeakPlan

Turn voice notes into private weekly tasks with manual editing, scheduling, and simple weekly planning.

## Demo

Add 2 product screenshots here before submission:

- Main screen with `Voice Note Recorder`, `Transcription Result`, and `Weekly Tasks`
- Weekly board or manual task creation flow

## Product Context

### End Users

- Students
- Busy individual planners
- Users who prefer speaking their plans instead of typing everything manually

### Problem

People often think about tasks faster than they can organize them. Voice notes are easy to record, but the result usually stays as unstructured audio or text, which makes weekly planning inconvenient.

### Our Solution

SpeakPlan lets a user record or upload an audio note, convert it into text, extract tasks, review them, and place them into a weekly board. The product also supports manual task creation and editing, so the user stays in control of the final plan.

## Features

### Implemented

- User registration and login
- Private user data isolation
- Voice note recording in the browser
- Audio file upload
- Speech transcription
- Task extraction from transcription
- Manual review and editing of extracted tasks before saving
- Manual task creation
- Weekly board with week navigation
- Task editing and deletion from the board
- `Todo` / `Done` filters
- Weekly recurring tasks
- HTTPS deployment through `nginx` for microphone access on a VM

### Not Yet Implemented

- Notifications and reminders
- Full voice note history page
- Categories and priorities
- Shared/team planning
- Calendar integrations
- Password reset and email verification

## Usage

1. Open the app in the browser.
2. Register an account or sign in.
3. Record a voice note or upload an audio file.
4. Wait for transcription and task extraction.
5. Review extracted tasks, edit dates/titles/descriptions if needed, and save them.
6. Create additional tasks manually if needed.
7. Use `Previous Week`, `Current Week`, `Next Week`, and `Today` to navigate the board.
8. Mark tasks as `done`, edit them, or delete them from the weekly board.

## Deployment

### VM OS

- Ubuntu 24.04

### What Should Be Installed On The VM

- `git`
- `docker`
- Docker Compose plugin (`docker compose`)

Optional but useful:

- `curl`

### Step-By-Step Deployment Instructions

1. Clone the repository on the VM.

```bash
git clone https://github.com/NadezhdaVoskan/se-toolkit-hackathon
cd SpeakPlan
```

2. Create the root environment file.

```bash
cp .env.example .env
```

3. Put TLS certificates into the `certs` folder.

Expected files:

- `certs/server.crt`
- `certs/server.key`

Example:

```bash
mkdir -p certs
cp /path/to/server.crt certs/server.crt
cp /path/to/server.key certs/server.key
```

4. Check that your `.env` allows the VM HTTPS origin.

At minimum, make sure `ALLOWED_ORIGINS` contains your HTTPS VM address, for example:

```env
ALLOWED_ORIGINS=https://10.93.25.188,http://localhost:3000,http://127.0.0.1:3000
```

5. Start the project.

```bash
docker compose up --build -d
```

6. Open the app in the browser through HTTPS.

```text
https://10.93.25.188/
```

7. If this is the first deployment after database changes, apply migrations.

```bash
docker compose exec backend alembic upgrade head
```

8. Check that the services are healthy.

```bash
docker compose ps
docker compose logs -f nginx
docker compose logs -f backend
```

9. Optional quick checks from the VM.

```bash
curl -I http://10.93.25.188/
curl -k -I https://10.93.25.188/
curl -k https://10.93.25.188/api/health
```

10. For microphone access, always use the HTTPS address in the browser.

```text
https://10.93.25.188/
```
