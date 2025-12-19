# 🚀 Quick Start Guide - Step-by-Step Commands

**Copy and paste these commands exactly as shown.**

---

## ✅ STEP 1: Open PowerShell Terminal

1. Press `Windows Key + X`
2. Click **"Windows PowerShell"** or **"Terminal"**
3. You should see a blue/black terminal window

---

## ✅ STEP 2: Navigate to Project Folder

Copy and paste this command:

```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI"
```
cd "C:\Users\varun\OneDrive\Desktop\MY AI\backend"


Press **Enter**. You should see the path change in your terminal.

---

## ✅ STEP 3: Create Python Virtual Environment (First Time Only)

Copy and paste these commands **one at a time**:

```powershell
py -m venv .venv
```

Wait for it to finish (takes 10-30 seconds).

Then activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

**✅ Check**: You should see `(.venv)` at the start of your terminal prompt.

**If you get an error** about execution policy, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try activating again.

---

## ✅ STEP 4: Install Python Dependencies (First Time Only)

Copy and paste these commands **one at a time**:

```powershell
pip install --upgrade pip
```

Wait for it to finish.

```powershell
pip install -r requirements.txt
```

**⏳ This takes 2-5 minutes** - wait until you see "Successfully installed..." messages.

---

## ✅ STEP 5: Start the Backend Server

Copy and paste this command:

```powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

**✅ What you should see:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**✅ Keep this terminal window open!** The backend is now running.

**✅ Test it:** Open your browser and go to: `http://localhost:8000/docs`
- You should see a FastAPI documentation page (Swagger UI).
- If you see this, the backend is working! ✅

---

## ✅ STEP 6: Open a NEW PowerShell Terminal (Keep Backend Running!)

1. Press `Windows Key + X` again
2. Open **another** PowerShell window
3. **DO NOT close the first terminal** (backend is running there)

---

## ✅ STEP 7: Navigate to Frontend Folder

Copy and paste this command:

```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI\frontend"
```

Press **Enter**.

---

## ✅ STEP 8: Install Node Dependencies (First Time Only)

Copy and paste this command:

```powershell
npm install
```

**⏳ This takes 1-3 minutes** - wait until you see "added X packages" message.

---

## ✅ STEP 9: Start the Frontend Server

Copy and paste this command:

```powershell
npm run dev
```

**✅ What you should see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**✅ Keep this terminal window open too!** The frontend is now running.

---

## ✅ STEP 10: Open the App in Your Browser

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: `http://localhost:5173`

**✅ You should see:**
- Dark-themed dashboard
- "Agent Command" box at the top
- Cards showing Tasks, Calendar, Inbox, Agent Reasoning

---

## ✅ STEP 11: Test the App

In the **Agent Command** box, type:

```
Create a task to reply to Alice's budget email today
```

Click **"Run"** or press Enter.

**✅ You should see:**
- Agent Reasoning card shows the intent and steps
- Tasks card updates with a new task
- Calendar and Inbox cards show sample data

---

## 🛑 How to Stop Everything

When you're done:

1. **Stop Frontend**: Go to the frontend terminal, press `Ctrl + C`, then type `Y` and press Enter
2. **Stop Backend**: Go to the backend terminal, press `Ctrl + C`, then type `Y` and press Enter

---

## 🔄 How to Restart Later

**Backend:**
```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI"
.\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend (in a new terminal):**
```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI\frontend"
npm run dev
```

---

## ❌ Troubleshooting

### Backend won't start?

**Check:**
- Is Python installed? Run: `python --version` (should show 3.10+)
- Are you in the right folder? Run: `pwd` (should show the project path)
- Is virtualenv activated? You should see `(.venv)` in your prompt
- Did dependencies install? Check for errors in Step 4

**Common error: "Module not found"**
- Run: `pip install -r requirements.txt` again

**Common error: "Address already in use"**
- Something else is using port 8000
- Change port: `uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001`
- Then update `frontend/vite.config.mts` to use port 8001

### Frontend won't start?

**Check:**
- Is Node.js installed? Run: `node --version` (should show v18+)
- Are you in the frontend folder? Run: `pwd`
- Did npm install complete? Check Step 8 for errors

**Common error: "Cannot find module"**
- Run: `npm install` again

### Frontend can't connect to backend?

**Check:**
- Is backend running? Go to `http://localhost:8000/docs` - does it load?
- Are both terminals still open?
- Try refreshing the browser page (`F5`)

---

## 📝 Summary

**You need TWO terminal windows open:**

1. **Terminal 1 (Backend)**: Running `uvicorn` command
2. **Terminal 2 (Frontend)**: Running `npm run dev` command

**Then open browser:** `http://localhost:5173`

That's it! 🎉


servers: backend
http://localhost:8000/docs

http://127.0.0.1:8000/

frontend:
http://localhost:5173/