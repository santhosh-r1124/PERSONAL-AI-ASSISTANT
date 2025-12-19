# Troubleshooting "Not Found" Error

## Quick Fixes

### 1. Check if Backend is Running

**In your backend terminal**, you should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

If you don't see this, **start the backend**:
```powershell
cd "C:\Users\varun\OneDrive\Desktop\MY AI"
.\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Test Backend Directly

Open your browser and go to:
- `http://localhost:8000/` - Should show `{"status":"ok",...}`
- `http://localhost:8000/api/health` - Should show `{"status":"healthy",...}`
- `http://localhost:8000/docs` - Should show FastAPI Swagger UI

If these don't work, **the backend is not running correctly**.

### 3. Check Frontend Proxy

The frontend uses Vite proxy to forward `/api/*` requests to `http://localhost:8000`.

**Check `frontend/vite.config.mts`** - it should have:
```typescript
proxy: {
  "/api": {
    target: "http://localhost:8000",
    changeOrigin: true
  }
}
```

### 4. Common Issues

**Issue: Backend running but getting 404**
- Make sure you're accessing `http://localhost:8000/api/tasks` (with `/api/` prefix)
- Check that the route exists in `backend/app/main.py`

**Issue: CORS errors**
- Backend already has CORS enabled, but if you see CORS errors, check the middleware in `main.py`

**Issue: Port already in use**
- Change port: `uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001`
- Update `frontend/vite.config.mts` to use port 8001

### 5. Verify Routes

The backend should have these routes:
- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `POST /api/agent/command` - Agent commands
- `GET /api/tasks` - List tasks
- `GET /api/calendar/events` - Calendar events
- `GET /api/inbox/email-tasks` - Email tasks

### 6. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for error messages
- **Network tab**: See if requests are being made and what status codes they return

### 7. Restart Everything

1. Stop backend (Ctrl+C in backend terminal)
2. Stop frontend (Ctrl+C in frontend terminal)
3. Restart backend
4. Restart frontend
5. Hard refresh browser (Ctrl+Shift+R)

---

## Still Not Working?

Check the backend terminal for error messages. Common errors:
- `ModuleNotFoundError` - Run `pip install -r requirements.txt`
- `Address already in use` - Change port or kill the process using port 8000
- Database errors - Check if `app.db` file exists and is accessible

