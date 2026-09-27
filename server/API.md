# Campus Pulse REST API Documentation

Production-style REST API Backend for the Campus Pulse Web Application built with **Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, Helmet, Cors, and Rate Limiting**.

---

## Base URL

```text
http://localhost:5000/api
```

---

## Authentication & Headers

Protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header using the Bearer scheme:

```http
Authorization: Bearer <your_jwt_token>
```

Default Admin Credentials (Seeded):
- **Email**: `admin@campuspulse.edu`
- **Password**: `Admin@123`

Default Student Credentials (Seeded):
- **Email**: `student@campuspulse.edu`
- **Password**: `Student@123`

---

## Error & Response Formats

### Standard Success Response Format (`200 OK`, `201 Created`)

```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response Format (`400`, `401`, `403`, `404`, `409`, `500`)

```json
{
  "success": false,
  "message": "Detailed error explanation",
  "errorCode": "ERROR_CODE_IDENTIFIER"
}
```

---

## API Endpoints Summary

### 1. Health Check

#### `GET /api/health`
Check backend service status.

- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "service": "Campus Pulse API",
  "status": "healthy",
  "timestamp": "2026-09-27T23:00:00.000Z"
}
```

---

### 2. User Authentication

#### `POST /api/auth/register`
Register a new student or admin user.

- **Auth**: None
- **Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@campuspulse.edu",
  "password": "Password@123",
  "role": "student"
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "60c72b2f9b1d8b0015f8e4a1",
      "name": "Jane Doe",
      "email": "jane@campuspulse.edu",
      "role": "student"
    }
  }
}
```

#### `POST /api/auth/login`
Authenticate user and obtain JWT token.

- **Auth**: None
- **Body**:
```json
{
  "email": "admin@campuspulse.edu",
  "password": "Admin@123"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "60c72b2f9b1d8b0015f8e4a0",
      "name": "System Admin",
      "email": "admin@campuspulse.edu",
      "role": "admin"
    }
  }
}
```

#### `GET /api/auth/me`
Get current logged in user details.

- **Auth**: Bearer Token Required
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60c72b2f9b1d8b0015f8e4a0",
      "name": "System Admin",
      "email": "admin@campuspulse.edu",
      "role": "admin"
    }
  }
}
```

---

### 3. Faculty APIs

#### `GET /api/faculty`
Get paginated list of faculty with dynamic working-hour status calculation.

- **Auth**: None
- **Query Parameters**:
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `10`)
  - `department` (optional)
  - `status` (optional)
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "faculty": [
      {
        "id": "fac_1",
        "name": "Dr. Sumana Maradithaya",
        "designation": "Professor & HoD",
        "department": "Information Science & Engineering",
        "email": "sumana.m@msrit.edu",
        "cabinLocation": "LHC / ISE Wing, 3rd Floor, HOD Office",
        "nodeId": "ise_hod_office",
        "todaySchedule": [
          {
            "time": "09:30 - 11:00 AM",
            "event": "Morning Lecture Session",
            "room": "Room-101"
          }
        ],
        "status": "Available in Cabin",
        "currentLocation": "LHC / ISE Wing, 3rd Floor, HOD Office",
        "nextAvailableTime": "Now (Consultation Open)"
      }
    ],
    "pagination": {
      "total": 409,
      "page": 1,
      "limit": 10,
      "totalPages": 41
    }
  }
}
```

#### `GET /api/faculty/:id`
Get single faculty by ID with dynamic status.

#### `GET /api/faculty/search?q=Sumana`
Search faculty by name, department, designation, or cabin location.

#### `GET /api/faculty/:id/schedule`
Get faculty today's schedule.

#### `GET /api/faculty/:id/status`
Get faculty real-time calculated status and current location.

#### `GET /api/faculty/department/:department`
Get faculty members belonging to a specific department.

---

### 4. Library & Occupancy APIs

#### `GET /api/libraries`
Get all physical libraries (ESB Library, LHC Library, Apex Library).

#### `GET /api/libraries/:id`
Get single library details.

#### `GET /api/libraries/:id/occupancy`
Get current estimated occupancy percentage for a specific library.

- **Response**:
```json
{
  "success": true,
  "data": {
    "libraryId": "esb_main_library",
    "name": "ESB Library",
    "occupancyPercentage": 45,
    "source": "estimated",
    "isOpen": true
  }
}
```

#### `GET /api/libraries/:id/occupancy/history`
Get historical occupancy records for analytics.

#### `GET /api/libraries/occupancy/current`
Get real-time occupancy percentages for all 3 libraries.

#### `GET /api/libraries/least-crowded`
Get the library currently having the lowest occupancy percentage.

---

### 5. Building APIs

#### `GET /api/buildings`
Get list of verified campus blocks (LHC, DES, Apex, Multipurpose Block, ESB, Quadrangle, Architecture Block, Workshop Block).

#### `GET /api/buildings/:id`
Get details of a campus block including boundary polygon coordinates.

#### `GET /api/buildings/:id/rooms`
Get verified rooms situated in the building.

#### `GET /api/buildings/:id/faculty`
Get faculty members stationed in the building.

---

### 6. Room APIs

#### `GET /api/rooms`
Get list of verified classrooms, labs, seminar halls, board rooms, and auditoriums.

#### `GET /api/rooms/:roomNumber`
Get room by room number (normalizes `AB401`, `AB-401`, `AB 401`).

#### `GET /api/rooms/search?q=LHC204`
Search rooms by room number or building.

#### `GET /api/rooms/building/:building`
Get verified rooms in a specific building.

#### `GET /api/rooms/department/:department`
Get verified rooms allocated to a specific department.

---

### 7. Issue Reporting APIs

#### `POST /api/issues`
Report a campus maintenance issue.

- **Auth**: None (or optional Bearer Token)
- **Body**:
```json
{
  "title": "Flickering Overhead Tube Light",
  "category": "Electricity",
  "description": "Two fluorescent fixtures in row 3 flicker intermittently during evening lectures.",
  "location": "LHC Block, Room 204",
  "priority": "Low",
  "reportedBy": "Udbhav Verma"
}
```

#### `GET /api/issues`
Get issue reports with optional filters (`status`, `priority`, `category`, `location`).

#### `GET /api/issues/:id`
Get detailed single issue report.

#### `PATCH /api/issues/:id/status`
Update status of an issue (`Reported`, `Under Review`, `In Progress`, `Resolved`).

#### `DELETE /api/issues/:id`
Delete an issue report (Protected / Admin).

---

### 8. Global Search API

#### `GET /api/search?q=Sumana`
Search across Faculty, Libraries, Buildings, Rooms, and Issues simultaneously.

- **Response**:
```json
{
  "success": true,
  "data": {
    "query": "Sumana",
    "faculty": [ ... ],
    "libraries": [ ... ],
    "buildings": [ ... ],
    "rooms": [ ... ],
    "issues": [ ... ]
  }
}
```

---

### 9. Ask Campus AI Grounded Query API

#### `POST /api/ai/query`
Natural language grounded AI query system anchored directly to MongoDB data.

- **Body**:
```json
{
  "query": "Which library is least crowded for CSE students?",
  "sessionId": "session_12345"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "intent": "LIBRARY_OCCUPANCY",
    "answer": "LHC Library currently has the lowest occupancy among libraries suitable for CSE students (35% estimated occupancy).",
    "data": {
      "library": "LHC Library",
      "occupancyPercentage": 35,
      "isOpen": true
    },
    "sessionId": "session_12345"
  }
}
```

---

### 10. Admin Protected APIs

Requires `Authorization: Bearer <Admin_JWT_Token>`.

- `POST /api/admin/faculty`: Add new faculty record
- `PATCH /api/admin/faculty/:id`: Update faculty details
- `DELETE /api/admin/faculty/:id`: Delete faculty record
- `PATCH /api/admin/libraries/:id`: Update library details
- `POST /api/admin/rooms`: Create new verified room
- `PATCH /api/admin/rooms/:roomNumber`: Update room details
- `PATCH /api/admin/issues/:id/status`: Update issue lifecycle status

---

### 11. Notifications API

#### `GET /api/notifications`
Get notifications.

#### `PATCH /api/notifications/:id/read`
Mark a notification as read.
