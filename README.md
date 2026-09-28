# 🚀 Campus Pulse

### An Intelligent Operating Layer for Campus Life

Campus Pulse is a full-stack campus companion platform designed to bring essential campus information, services, navigation, and intelligent assistance into one unified experience.

It helps students **ask, see, navigate, and improve their campus** through interactive maps, faculty availability, library occupancy, campus search, AI assistance, issue reporting, and more.

> **Built for Async'26**

---

## 🌐 Live Project

### Frontend
**GitHub Pages:**  
https://technocrat17.github.io/Campus-Pulse/

> **Deployment note:** The current GitHub Pages deployment hosts the **React/Vite frontend only**. GitHub Pages is a static hosting platform and does not execute the Node.js/Express backend included in this repository.

### Source Code
**GitHub Repository:**  
https://github.com/Techno-Crat17/Campus-Pulse

The repository contains both the frontend and backend:

```text
Campus-Pulse/
├── src/                    # React + TypeScript frontend
├── public/                 # Static frontend assets
├── server/                 # Node.js + Express backend
├── scripts/                # Data/scraping/testing utilities
├── package.json            # Frontend configuration
└── vite.config.ts          # Vite configuration
```

---

# ✨ Features

## 🗺️ Interactive Campus Navigation

Explore the campus through an interactive map experience with information about campus buildings, locations, rooms, and facilities.

Campus Pulse includes campus-specific geographic data and verified campus blocks to make finding locations easier.

---

## 🤖 Campus AI Assistant

The Campus Pulse assistant allows students to ask questions about the campus and receive contextual responses.

It can help with queries related to:

- Buildings
- Rooms
- Faculty
- Libraries
- Campus facilities
- Navigation
- General campus information

The project also includes a backend AI query endpoint for handling campus assistant requests.

---

## 📚 Library & Space Occupancy

Campus Pulse provides information about campus libraries and their occupancy.

The platform includes:

- Library information
- Capacity
- Opening hours
- Current occupancy data
- Occupancy-based recommendations
- Least-crowded library identification

This allows students to find suitable spaces for studying without manually checking different locations.

---

## 👨‍🏫 Faculty Availability

The platform includes a searchable faculty directory with information such as:

- Faculty name
- Department
- Designation
- Cabin/location
- Availability status
- Schedule information
- Next available time

Faculty data can be served through the backend API, with local frontend data available as a fallback.

---

## 🔎 Smart Campus Search

Campus Pulse provides a unified search experience across multiple campus entities, including:

- Faculty
- Buildings
- Libraries
- Rooms
- Issues

The backend exposes a global search API while the frontend also contains local fallback data.

---

## 🛠️ Campus Issue Reporting

Students can report campus-related issues through the platform.

Issues can contain information such as:

- Title
- Category
- Description
- Location
- Priority
- Status
- Reporter

The backend provides APIs for creating issues, retrieving issues, filtering them, and updating their status.

---

## 🔐 Authentication & Roles

The backend includes authentication using:

- User registration
- User login
- JWT authentication
- Student role
- Admin role

Protected routes can be accessed through JWT-based authentication.

---

## 🏫 Campus Data

Campus Pulse contains structured data for the campus, including:

- Buildings
- Rooms
- Libraries
- Faculty
- Departments
- Geographic locations
- Campus blocks

The repository also contains seed data and utilities for populating the backend database.

---

# 🧩 Technology Stack

## Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**
- **Mapbox GL**
- **Google Maps JavaScript API**
- **Canvas Confetti**

## Backend

- **Node.js**
- **Express.js**
- **Mongoose**
- **MongoDB**
- **JWT**
- **bcryptjs**
- **Helmet**
- **CORS**
- **Express Rate Limit**
- **dotenv**

## Development & Deployment

- **GitHub**
- **GitHub Actions**
- **GitHub Pages**
- **Vite**
- **Node.js**

---

# 🏗️ Architecture

Campus Pulse is structured as a full-stack application.

```text
                    ┌──────────────────────┐
                    │       Student        │
                    │      / Browser       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React + Vite UI    │
                    │     TypeScript       │
                    └──────────┬───────────┘
                               │
                         REST API Calls
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       MongoDB        │
                    │      Database        │
                    └──────────────────────┘
```

### Current deployment

At the moment, only the frontend is deployed through GitHub Pages:

```text
Browser
   │
   ▼
GitHub Pages
   │
   ▼
React Frontend
```

The backend remains inside the repository under:

```text
server/
```

and is designed to be deployed separately on a Node.js-compatible backend hosting platform.

---

# 📁 Project Structure

```text
Campus-Pulse/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── public/
│   └── assets/
│
├── src/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── data/
│   ├── services/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   ├── API.md
│   └── package.json
│
├── scripts/
│
├── faculty_msrit.json
├── faculty_msrit_dynamic.json
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
└── README.md
```

---

# 🔌 Backend API

The Express backend is organized into REST API modules.

### Health

```text
GET /api/health
```

### Faculty

```text
GET /api/faculty
GET /api/faculty/:id
GET /api/faculty/search
```

### Libraries

```text
GET /api/libraries
GET /api/libraries/:id/occupancy
GET /api/libraries/occupancy/current
GET /api/libraries/least-crowded
```

### Buildings

```text
GET /api/buildings
GET /api/buildings/:id
```

### Rooms

```text
GET /api/rooms
GET /api/rooms/:roomNumber
```

### Issues

```text
GET /api/issues
POST /api/issues
PATCH /api/issues/:id/status
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Search

```text
GET /api/search
```

### AI

```text
POST /api/ai/query
```

### Notifications

```text
/api/notifications
```

For more detailed backend information, see:

```text
server/API.md
```

---

# ⚙️ Running Locally

## Prerequisites

Install:

- Node.js
- npm
- MongoDB or a MongoDB Atlas database
- Git

---

## 1. Clone the repository

```bash
git clone https://github.com/Techno-Crat17/Campus-Pulse.git
cd Campus-Pulse
```

---

# 💻 Frontend Setup

Install frontend dependencies:

```bash
npm install
```

Create a local environment file if required:

```bash
cp .env.example .env
```

Configure the required frontend API keys/environment variables.

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🖥️ Backend Setup

Move into the backend directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

# 🔗 Connecting Frontend & Backend

The frontend API client is located at:

```text
src/services/api.ts
```

The API base URL is configured using:

```env
VITE_API_URL=http://localhost:5000/api
```

Therefore, the local architecture becomes:

```text
React
  │
  │ VITE_API_URL
  ▼
http://localhost:5000/api
  │
  ▼
Express
  │
  ▼
MongoDB
```

For production deployment, `VITE_API_URL` should point to the publicly deployed backend API instead of `localhost`.

---

# 🗄️ Database

Campus Pulse uses **MongoDB** through **Mongoose**.

The backend contains database models for entities including:

- Users
- Faculty
- Buildings
- Rooms
- Libraries
- Library occupancy
- Issues

The project also contains a database seeding system located at:

```text
server/src/data/seed.js
```

The seed process prepares the backend with campus data and initial records required for development/testing.

---

# 🛡️ Backend Security

The backend includes several production-oriented mechanisms:

- JWT authentication
- Password hashing with bcrypt
- Helmet security headers
- CORS configuration
- Express rate limiting
- Centralized error handling
- Environment-based configuration

Sensitive configuration values should be stored in environment variables and **must not be committed to the repository**.

---

# 🚀 Deployment

## Current Frontend Deployment

The frontend is currently deployed using **GitHub Pages** through GitHub Actions.

The workflow is located at:

```text
.github/workflows/deploy.yml
```

The deployment process:

```text
GitHub Push
     │
     ▼
GitHub Actions
     │
     ▼
npm install
     │
     ▼
npm run build
     │
     ▼
Vite production build
     │
     ▼
GitHub Pages
```

### Important

GitHub Pages only serves the generated static frontend.

It does **not** run:

```text
Node.js
Express
MongoDB
server/src/server.js
```

Therefore, the backend included in this repository needs to be deployed separately on a backend/server hosting platform for the complete full-stack application to operate in production.

---

# 🛣️ Planned Production Architecture

The intended full-stack deployment architecture is:

```text
                 ┌─────────────────┐
                 │      User       │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ React Frontend  │
                 │  Vite / Vercel  │
                 └────────┬────────┘
                          │
                       HTTPS
                          │
                          ▼
                 ┌─────────────────┐
                 │ Node + Express  │
                 │    Backend      │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  MongoDB Atlas  │
                 └─────────────────┘
```

The current GitHub repository remains the central source code repository for both frontend and backend.

---

# 📱 Future PWA Support

Campus Pulse is structured as a web application and can be extended into a **Progressive Web App (PWA)**.

The planned PWA functionality includes:

- Installable web application
- App-style standalone experience
- Custom application icon
- Web App Manifest
- Service worker
- Asset caching
- Improved mobile experience
- Potential offline support for selected campus information

PWA functionality is a separate layer from the backend deployment and can be added after the production frontend/backend connection is established.

---

# 🎯 Project Goals

Campus Pulse aims to provide a unified digital layer for campus life.

### Ask

Use intelligent assistance to find answers about the campus.

### See

Understand campus activity, spaces, libraries, and availability.

### Navigate

Find buildings, rooms, facilities, and campus locations.

### Improve

Report campus issues and help identify areas requiring attention.

---

# 🔮 Future Scope

Potential future improvements include:

- Fully deployed production backend
- Persistent real-time occupancy data
- Enhanced notification system
- More advanced AI campus assistant capabilities
- PWA installation and offline support
- Push notifications
- Expanded campus integrations
- Improved admin dashboard
- Live campus telemetry
- Additional campus services

---

# 👥 Team

**Campus Pulse**  
Built for **Async'26 Hackathon**

---

# 📜 License

This project is currently intended as a hackathon/project submission.

Refer to the repository for the latest licensing and usage information.

---

## 🔗 Links

- 🌐 **Live Frontend:** https://technocrat17.github.io/Campus-Pulse/
- 💻 **GitHub:** https://github.com/Techno-Crat17/Campus-Pulse

---

### Campus Pulse

**Ask your campus. See your campus. Navigate your campus. Improve your campus.**
