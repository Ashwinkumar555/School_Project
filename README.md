# EduConnect 🎓🏛️

> **Smart Government School, Student Welfare & Village Community Support Platform**

EduConnect is an integrated full-stack web platform designed to empower rural government schools, track student welfare schemes (such as Mid-Day Meals, scholarships, and health checkups), and mobilize local village communities, donors, and volunteer mentors for equitable education.

---

## 🏗️ Architecture & Technology Stack

```
EduConnect/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # MongoDB / Mongoose connection
│   │   ├── controllers/      # Health & Auth Controllers
│   │   ├── middleware/       # JWT Auth & Global Error Handlers
│   │   ├── models/           # Multi-Role Mongoose User Schema
│   │   ├── routes/           # REST Route endpoints (/api/health, /api/auth)
│   │   ├── utils/            # JWT Token Generator
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # HTTP Server Entry Point
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Button, Card, Input, Badge, Modal
│   │   │   └── layout/       # Navbar, Footer, Layout
│   │   ├── context/          # AuthContext (JWT & session state)
│   │   ├── pages/            # Landing, Login, Register, Dashboard, 404
│   │   ├── services/         # Axios API service layer (api, auth, health)
│   │   ├── styles/           # Tailwind CSS directives & theme
│   │   ├── App.jsx           # React Router route tree
│   │   └── main.jsx          # Entry point
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── package.json              # Monorepo root script helpers
└── README.md
```

### Core Technologies
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `morgan`, `dotenv`

---

## 👥 Multi-Tier Role System

| Role Key | Role Name | Primary Responsibilities |
| :--- | :--- | :--- |
| `headmaster_admin` | **Headmaster / School Admin** | Infrastructure repair requests, teacher management, grant compliance |
| `teacher` | **Teacher / Educator** | Classroom attendance, student grading, dropout risk reporting |
| `welfare_officer` | **Welfare Officer** | Mid-day meal audits, scholarship distribution, healthcare checkups |
| `student_parent` | **Parent / Guardian** | Student attendance alerts, health camp schedules, announcements |
| `community_volunteer` | **Village Community & Donor** | Volunteer teaching, book/equipment donation drives, Panchayat sync |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: Local MongoDB server or MongoDB Atlas URI

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env     # On Windows: copy .env.example .env
npm run dev              # Starts Express on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env     # On Windows: copy .env.example .env
npm run dev              # Starts Vite on http://localhost:5173
```

---

## 🩺 Health & Diagnostic Endpoint

Verify backend operation anytime via:
```http
GET http://localhost:5000/api/health
```

Sample Response:
```json
{
  "success": true,
  "status": "healthy",
  "message": "EduConnect Backend API is operational",
  "timestamp": "2026-08-15T06:20:00.000Z",
  "uptime": "42 seconds",
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "api": {
      "status": "online",
      "port": 5000
    },
    "database": {
      "type": "MongoDB",
      "status": "connected",
      "connected": true,
      "host": "127.0.0.1",
      "databaseName": "educonnect"
    }
  }
}
```

---

## 🔐 Auth API Endpoints

- `POST /api/auth/register`: Create user account with name, email, password, role, phone, school, village.
- `POST /api/auth/login`: Authenticate with email & password, receives JWT token.
- `GET /api/auth/me`: Get current authenticated user profile (`Bearer <token>` required).
- `GET /api/auth/roles`: Returns available roles and metadata.

---

## 🛠️ Monorepo Root Commands

From the root directory:
- `npm run dev`: Runs frontend dev server
- `npm run server`: Runs backend dev server
- `npm run build:frontend`: Builds frontend production bundle
