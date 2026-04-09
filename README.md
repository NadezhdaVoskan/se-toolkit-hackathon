# SpeakPlan

Turn voice notes into private weekly tasks with manual editing, scheduling, and simple weekly planning.

## Demo
<img width="1825" height="503" alt="image" src="https://github.com/user-attachments/assets/cf98a9aa-c5b1-4960-9349-f180fc6b1050" />
<img width="1826" height="831" alt="image" src="https://github.com/user-attachments/assets/9bc5cb11-a1cd-4c04-a13d-2c388dd32cc6" />
<img width="1826" height="920" alt="image" src="https://github.com/user-attachments/assets/0b637a30-d922-4d49-9e5e-d384206f626d" />
<img width="1800" height="740" alt="image" src="https://github.com/user-attachments/assets/407fa869-7744-4b34-b9e3-24504ec1f548" />
<img width="1598" height="905" alt="image" src="https://github.com/user-attachments/assets/d9bcae26-8e37-4b42-ae87-7f8a655f093c" />

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
