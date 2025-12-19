## How to Run the AI Personal Task Automation Agent

### 1. Prerequisites

- **Python** 3.10+ (`python --version`)
- **Node.js + npm** (`node -v`, `npm -v`)

Run all commands from:

```bash
C:\Users\varun\OneDrive\Desktop\MY AI
```

On Windows, use **PowerShell**.

---

### 2. Backend (FastAPI + Agent)

#### 2.1 Create & activate virtualenv (first time)

```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI"
python -m venv .venv
  .\.venv\Scripts\Activate.ps1
```

#### 2.2 Install Python dependencies (first time)

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.3 (Optional) Preprocess datasets

```powershell
python .\scripts\prepare_data.py
```

#### 2.4 Run the backend server

**Option A: Use the startup script (recommended)**

```powershell
.\start_backend.ps1
```

**Option B: Manual command**

```powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

- Keep this terminal open.
- **IMPORTANT**: Access the backend at `http://localhost:8000` or `http://127.0.0.1:8000` (NOT `http://0.0.0.0:8000`)
- Test in browser: `http://localhost:8000/docs` (should show FastAPI Swagger UI)

---

### 3. Frontend (React Dashboard)

Open a **new** PowerShell window.

#### 3.1 Install Node dependencies (first time)

```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI\frontend"
npm install
```

#### 3.2 Run the frontend dev server

```powershell
npm run dev
```

- Open `http://localhost:5173` in your browser.

---

### 4. Using the App

In the browser UI:

- Use the **Agent Command** box, e.g.:
  - `Create a task to reply to Alice's budget email today`
  - `Reschedule my tasks to tomorrow afternoon`
- Watch:
  - **Tasks** card update with internal tasks.
  - **Calendar** card show Google Calendar sample events.
  - **Inbox** card show email-derived Todoist sample tasks.
  - **Agent Reasoning** card show intent, steps, and tool calls.

---

### 5. Stopping & Restarting

- Stop backend/frontend: `Ctrl + C` in the terminal.
- Restart backend:

```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI"
.\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

---

### 6. Troubleshooting

#### Backend won't start or shows "ERR_ADDRESS_INVALID"

**Problem**: You're trying to access `http://0.0.0.0:8000` in your browser.

**Solution**: 
- Use `http://localhost:8000` or `http://127.0.0.1:8000` instead.
- `0.0.0.0` is a bind address (tells the server to listen on all interfaces), but browsers need `localhost` or `127.0.0.1`.

**Check if backend is running**:
1. Look at your backend terminal - you should see:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   ```

2. If you see errors instead, check:
   - Are all dependencies installed? Run: `pip install -r requirements.txt`
   - Is Python 3.10+ installed? Run: `python --version`
   - Are there import errors? Check the terminal output for red error messages.

**Test backend directly**:
- Open `http://localhost:8000/docs` in your browser - you should see the FastAPI documentation page.
- If that works, the backend is running correctly.

#### Frontend can't connect to backend

**Problem**: Frontend shows "Failed to fetch" or network errors.

**Solution**:
1. Make sure backend is running (see above).
2. Check that backend is on `http://localhost:8000` (or `http://127.0.0.1:8000`).
3. Check `frontend/vite.config.mts` - it should proxy `/api` to `http://localhost:8000`.
4. Restart both backend and frontend.

#### Port 8000 already in use

**Problem**: `Address already in use` error.

**Solution**:
- Find what's using port 8000: `netstat -ano | findstr :8000`
- Kill the process or use a different port: `uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001`
- Update `frontend/vite.config.mts` to proxy to the new port.

- Restart frontend:

```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI\frontend"
npm run dev
```



