# 🤖 Personal AI Task Automation Agent

## 🌟 Overview
The **Personal AI Task Automation Agent** is a sophisticated, multi-modal productivity tool designed to bridge the gap between natural language and structured task management. Built with a modern tech stack and powered by cutting-edge Large Language Models (LLMs), it acts as an autonomous coordinator for your digital life.

---

## 🚀 Core Functionalities

### 1. Multi-Modal Interaction
*   **Text Commands:** Interact with the agent through a clean, intuitive chat interface.
*   **Voice Integration:** Powered by **Google Gemini 1.5 Flash**, the agent can transcribe your voice in real-time and respond with spoken-style feedback, making it truly hands-free.

### 2. Autonomous Task Extraction
The agent doesn't just wait for you to tell it what to do. In **Autonomous Mode**, it:
*   Scans your **Gmail** inbox for action items, deadlines, and follow-ups.
*   Analyzes your **Google Calendar** for upcoming meetings that might require preparation tasks.
*   Automatically populates your task list with extracted items, ensuring nothing falls through the cracks.

### 3. Agentic Reasoning (Chain-of-Thought)
Unlike traditional "dumb" bots, this agent shows its work. The frontend features a **Reasoning Card** that displays:
*   **Intent Detection:** What the agent thinks you want to do.
*   **Action Planning:** The step-by-step logic it will follow.
*   **Execution Results:** Real-time feedback on what was accomplished.

### 4. Smart Calendar & Inbox Sync
*   **OAuth2 Security:** Securely connects to your Google account using industry-standard OAuth2 protocols.
*   **Conflict Detection:** Identifies scheduling conflicts and suggests resolutions.
*   **Status Tracking:** Keeps your tasks, emails, and calendar in perfect harmony.

---

## 🏗️ Technical Architecture

### **Backend (The Brain)**
*   **Framework:** FastAPI (Python) for high-performance, asynchronous API handling.
*   **Database:** SQLAlchemy with SQLite for reliable local data persistence.
*   **AI Orchestration:** **LangChain** and the **Google GenAI SDK** are used to manage complex prompt chains and tool-calling capabilities.
*   **Task Scheduling:** APScheduler manages the background autonomous cycles.

### **Frontend (The Face)**
*   **Framework:** React (Vite) for a lightning-fast, responsive user experience.
*   **Styling:** Tailwind CSS for a modern, dark-themed dashboard aesthetics.
*   **Animations:** Framer Motion for smooth transitions and interactive feedback.
*   **State Management:** Built-in React hooks and custom service layers for API communication via Axios.

---

## 🔄 How It Works (Step-by-Step)

1.  **Input:** User provides a natural language command (e.g., "Create a task for the budget meeting at 3 PM tomorrow").
2.  **Orchestration:** The backend's gent_orchestrator uses **Gemini** to decompose the request into a JSON-based execution plan.
3.  **Tool Execution:** The agent executes the necessary tools (e.g., create_task, list_calendar_events) against the local DB or external APIs.
4.  **Response Generation:** Gemini synthesizes the execution results into a human-readable (and speakable) response.
5.  **Autonomous Cycle:** Periodically, the background agent runs a "scan" of integrated services to proactively manage your day.

---

## 🛠️ Tech Stack Summary
*   **Languages:** Python, TypeScript, HTML/CSS
*   **AI Models:** Google Gemini 1.5 Pro/Flash, OpenAI (Optional)
*   **APIs:** Google Calendar API, Gmail API, FastAPI
*   **Deployment:** Supports local uvicorn hosting and standard Node.js development servers.

---

## 📝 License & Copyright
© 2026 **Santhosh Rajinikanth**. All rights reserved.
This project is a testament to the power of Agentic AI in personal productivity.

---

> *"The best way to predict the future is to automate it."*
