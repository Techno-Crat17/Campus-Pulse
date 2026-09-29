# Campus Pulse REST API Backend

Production-style REST API Backend for the **Campus Pulse** Smart Campus Intelligence Platform built with **Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, Helmet, Cors, and Rate Limiting**.

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
# Navigate to project root
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup

Create `server/.env` (or copy from `server/.env.example`):

```ini
PORT=5000
NODE_ENV=development

# MongoDB Connection String (If left empty, an automatic in-memory MongoDB server will start)
MONGODB_URI=mongodb://localhost:27017/campuspulse

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env` (or `.env` in root):

```ini
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Seeding

Run the idempotent database seed script to populate all 409 faculty records, 3 physical libraries, 8 campus blocks, 51 verified rooms, sample maintenance issues, and system accounts:

```bash
npm run seed
```

*(Note: The server also auto-seeds cleanly on first startup if the database is empty).*

### 4. Running the Application

```bash
# Start Backend REST Server
npm run server

# Start Frontend Dev Server (in a separate terminal)
npm run dev
```

---

## 📊 Database Collections Summary

1. `users`: System user accounts (roles: `student`, `admin`)
2. `faculty`: 409 preserved faculty members with dynamic status engines
3. `libraries`: Exactly 3 libraries (**ESB Library**, **LHC Library**, **Apex Library**)
4. `library_occupancy`: Dynamic percentage occupancies (0–100%)
5. `buildings`: Verified campus blocks with coordinates and boundary polygons
6. `rooms`: Verified classrooms, labs, seminar halls, board rooms, auditoriums
7. `issues`: Maintenance reporting lifecycle tickets
8. `notifications`: System notifications

*(Note: Lost & Found backend logic is disabled and remains "Coming Soon" per project requirements).*

---

## 📡 API Endpoint Reference Table

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Service & Database health status |
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Authenticate user & get JWT |
| `GET` | `/api/auth/me` | Bearer | Get current logged in user profile |
| `GET` | `/api/faculty` | None | Get paginated faculty (`?page=1&limit=10`) |
| `GET` | `/api/faculty/:id` | None | Get single faculty details with dynamic status |
| `GET` | `/api/faculty/search?q=` | None | Search faculty by name/dept/cabin/designation |
| `GET` | `/api/faculty/:id/schedule` | None | Get faculty today's schedule |
| `GET` | `/api/faculty/:id/status` | None | Get real-time status and current location |
| `GET` | `/api/faculty/department/:dept` | None | Get faculty members of a specific department |
| `GET` | `/api/libraries` | None | Get all 3 physical libraries |
| `GET` | `/api/libraries/:id` | None | Get single library details |
| `GET` | `/api/libraries/:id/occupancy` | None | Get estimated occupancy percentage for library |
| `GET` | `/api/libraries/occupancy/current` | None | Get occupancies for all libraries |
| `GET` | `/api/libraries/least-crowded` | None | Get library with lowest current occupancy % |
| `GET` | `/api/buildings` | None | Get all verified campus blocks |
| `GET` | `/api/buildings/:id` | None | Get building details & boundary polygon |
| `GET` | `/api/rooms` | None | Get list of verified rooms |
| `GET` | `/api/rooms/:roomNumber` | None | Get room details (normalizes `AB401`, `AB-401`, `AB 401`) |
| `GET` | `/api/issues` | None | Get issue reports (`?status=`, `?priority=`, etc.) |
| `POST` | `/api/issues` | None/Bearer | Submit a campus maintenance issue |
| `PATCH` | `/api/issues/:id/status` | Bearer | Update issue status (`Reported`, `In Progress`, etc.) |
| `GET` | `/api/search?q=` | None | Categorized search across faculty/rooms/buildings/libraries/issues |
| `POST` | `/api/ai/query` | None | Ask Campus AI grounded query engine with session context |

---

## 🔒 Security & Middleware

- Passwords hashed using `bcryptjs`
- Standardized error format: `{ "success": false, "message": "...", "errorCode": "..." }`
- Standardized success format: `{ "success": true, "data": ... }`
