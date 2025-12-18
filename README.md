# AI MOM System

This project contains the source code for the AI-Powered Meeting Intelligence Platform, featuring a React frontend and a FastAPI backend.

## Project Structure

- `frontend/`: React + Vite application (originally "MeetFlow")
- `backend/`: FastAPI + Python application

## Getting Started

### Backend

1. Navigate to `backend/`
2. Create virtual environment and source it
3. Install dependencies: `pip install -r requirements.txt`
4. Run server: `uvicorn app.main:app --reload`
   - Server runs on `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

### Frontend

1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
   - App runs on `http://localhost:8080`
   - Proxy configured to forward `/api` and `/socket.io` to backend

## Features

- **Frontend**: Modern UI with Dashboard, Meeting Room, Schedule, and Minutes views.
- **Backend**: Authentication, Meeting Management, Real-time Signaling (Socket.IO), and AI Integration.