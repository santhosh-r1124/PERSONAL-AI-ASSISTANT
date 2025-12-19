# How to Work with Vizoro.ai - Autonomous AI Task Automation

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Application
- Open your browser to: `http://localhost:5173` (or the port shown in terminal)
- Login with any valid Gmail address (e.g., `yourname@gmail.com`)
- Use any password (authentication is simplified for demo)

---

## 🤖 Autonomous AI Agent - How It Works

### **Automatic Task Extraction**

The AI agent **automatically** extracts and creates tasks from:

1. **Email Tasks** (`email_auto` source)
   - Automatically scans email-derived tasks
   - Only includes tasks with due dates from **today through January 1, 2026**
   - Tasks without due dates are assigned reasonable future dates
   - Past due dates are adjusted to today at 9 AM

2. **Calendar Events** (`calendar_auto` source)
   - Automatically creates follow-up tasks for meetings
   - Follow-up tasks are due 24 hours after meeting ends
   - Only creates tasks for events within the date range (today - Jan 1, 2026)

### **Automatic Task Management**

1. **Auto-Completion**
   - Tasks overdue by more than 7 days are automatically marked as completed
   - This prevents clutter from forgotten tasks

2. **Real-Time Updates**
   - Agent runs automatically every 5 minutes
   - Tasks are created/updated in real-time
   - No manual intervention needed

---

## 📋 How to Use

### **Method 1: Fully Automated (Recommended)**

1. **Just Login** - The AI agent runs automatically:
   - On login
   - Every 5 minutes while you're logged in
   - Extracts tasks from emails/calendar
   - Creates them in your task list
   - Auto-completes overdue tasks

2. **View Your Tasks**:
   - **Active Tasks** - Shows all open tasks (including AI-created ones)
   - **Task History** - Shows completed tasks
   - Tasks with "AI" badge are auto-created by the agent

### **Method 2: Manual Trigger**

1. Click **"Run AI Agent Now"** button in the "🤖 AI Autonomous Agent" card
2. Agent will:
   - Extract tasks from emails (due: today - Jan 1, 2026)
   - Extract follow-up tasks from calendar
   - Auto-complete overdue tasks
   - Refresh your task list

### **Method 3: Natural Language Commands**

Use the "Agent Command" box to give natural language instructions:
- `"Create a task to finish the Q3 deck"`
- `"Reschedule my high-priority tasks to tomorrow"`
- `"Pull tasks from my recent emails"`

### **Method 4: Quick Add Task**

Use the "Quick Add Task" form to manually create tasks:
- Enter task title
- Select priority (P1-P4)
- Click "Add"

---

## 🎯 Task Sources

Tasks can come from:

1. **email_auto** - Automatically extracted from emails
2. **calendar_auto** - Automatically created from calendar events
3. **internal** - Manually created by you
4. **ai_proactive** - AI-generated proactive suggestions

---

## 📅 Date Range Filtering

**All tasks are filtered to due dates from TODAY through January 1, 2026:**

- ✅ Tasks with due dates in this range → Included
- ✅ Tasks without due dates → Assigned dates within range
- ❌ Tasks with due dates before today → Adjusted to today
- ❌ Tasks with due dates after Jan 1, 2026 → Excluded

---

## 🔄 Automatic Workflow

```
1. User logs in
   ↓
2. AI Agent runs automatically
   ↓
3. Scans emails → Extracts tasks → Creates in DB
   ↓
4. Scans calendar → Creates follow-up tasks
   ↓
5. Auto-completes overdue tasks (>7 days)
   ↓
6. Updates task list in real-time
   ↓
7. Repeats every 5 minutes
```

---

## 🛠️ Troubleshooting

### **Tasks Not Appearing?**

1. Check backend is running: `http://localhost:8000/api/health`
2. Click "Run AI Agent Now" manually
3. Check browser console for errors
4. Verify email/calendar data exists in `data/` folder

### **Backend Not Starting?**

```bash
# Install dependencies
pip install -r requirements.txt

# Check Python version (3.9+)
python --version

# Run with explicit host
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### **Frontend Not Loading?**

```bash
# Install dependencies
npm install

# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

---

## 📊 Understanding Task Status

- **open** - Active task, not yet completed
- **scheduled** - Task with specific time slot
- **completed** - Task finished (manually or auto-completed)
- **missed** - Task past due date

---

## 🎨 Features

- ✅ **Fully Automated** - No manual task creation needed
- ✅ **Smart Filtering** - Only relevant tasks (today - Jan 1, 2026)
- ✅ **Auto-Completion** - Overdue tasks auto-completed
- ✅ **Real-Time Updates** - Tasks appear instantly
- ✅ **AI Badge** - See which tasks were AI-created
- ✅ **Professional UI** - Clean, modern interface
- ✅ **Dark/Light Themes** - Switch themes easily

---

## 🚀 Next Steps

1. **Login** to the application
2. **Wait 5 minutes** or click "Run AI Agent Now"
3. **View your tasks** in the Active Tasks section
4. **Tasks with "AI" badge** are auto-created
5. **Complete tasks** manually or let AI handle overdue ones

---

## 💡 Tips

- The agent runs automatically - you don't need to do anything!
- Tasks are filtered to relevant dates (today - Jan 1, 2026)
- Overdue tasks (>7 days) are auto-completed
- You can still manually create tasks if needed
- Use natural language commands for complex operations

---

**Enjoy your fully automated AI task management system!** 🎉

