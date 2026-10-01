# 🏫 Campus Pulse

### Smart Campus Intelligence Platform

> **Ask your campus. See your campus. Navigate your campus. Improve your campus.**

Campus Pulse is a full-stack **campus intelligence platform** built for MSRIT that brings campus information, navigation, faculty discovery, study-space recommendations, issue reporting, lost & found, campus services, and AI-powered assistance into a single web application.

Instead of forcing students to search across multiple sources, Campus Pulse provides one unified interface for discovering and interacting with campus information.

**Built for ASYNC'26**

---

## 🌐 Live Demo

**Live Application:**  
https://campus-pulse-mu-bice.vercel.app/

**GitHub Repository:**  
https://github.com/Techno-Crat17/Campus-Pulse

> The frontend is a React/Vite application. The backend is a separate Node.js/Express service connected to MongoDB.

---

# ✨ What Campus Pulse Solves

Campus information is often distributed across different sources such as websites, notices, directories, maps, and informal communication channels.

Campus Pulse brings these campus services together through a unified platform.

### Students can:

- 🔎 Search campus information
- 🤖 Ask the Campus AI assistant questions
- 🗺️ Explore the campus using an interactive map
- 👨‍🏫 Find faculty and their locations/availability
- 📚 Discover libraries and study spaces
- 📊 Check estimated library occupancy
- 🛠️ Report campus issues
- 🔐 Use authenticated student/admin features
- 📦 Report and discover lost & found items
- 📢 Access announcements and campus information
- 🎓 Discover clubs and campus communities
- 📅 Access campus events and related information

---

# 🎯 Core Features

## 🤖 Ask Campus AI

The Campus AI assistant provides a natural-language interface for querying campus information.

Users can ask questions such as:

```text
Which library is least crowded?

Where is the ISE department?

Where is Professor X's cabin?

Which building contains Room AB401?
```

The backend exposes:

```http
POST /api/ai/query
```

The system can use structured campus data to generate contextual responses and also provides a local fallback AI/data engine when the backend is unavailable.

---

## 🗺️ Interactive Campus Map

Campus Pulse provides an interactive geographic campus explorer.

The map supports:

- Campus buildings
- Building locations
- Building boundaries
- Rooms
- Facilities
- Map-based navigation
- Direct navigation from campus information pages

The frontend integrates mapping services including:

- Google Maps JavaScript API
- Mapbox GL

Campus building data includes verified coordinates and polygon boundaries used to represent campus blocks.

---

## 👨‍🏫 Faculty Directory

The faculty module provides a searchable directory containing information such as:

- Faculty name
- Department
- Designation
- Email
- Cabin/location
- Current status
- Today's schedule
- Next available time

Faculty information can be retrieved through the backend API while verified local data is available as a fallback.

---

## 📚 Library & Study Space Intelligence

Campus Pulse provides information about campus libraries and study spaces.

Features include:

- Library directory
- Opening status
- Capacity information
- Estimated occupancy
- Occupancy history
- Current occupancy comparison
- Least-crowded library recommendation

Example:

```http
GET /api/libraries/occupancy/current
GET /api/libraries/least-crowded
```

> Occupancy values are currently **estimated/demo data**, not direct real-time sensor telemetry.

---

## 🔎 Global Campus Search

Campus Pulse provides unified search across multiple campus entities.

Search can include:

- Faculty
- Buildings
- Libraries
- Rooms
- Issues

Example:

```http
GET /api/search?q=ISE
```

The frontend also contains local fallback datasets so important campus information can remain accessible when the backend is unavailable.

---

## 🛠️ Campus Issue Reporting

Students can report campus maintenance or infrastructure issues.

Issue records can contain:

- Title
- Category
- Description
- Location
- Priority
- Status
- Reporter
- Timestamp

Supported lifecycle states include:

```text
Reported
     ↓
Under Review
     ↓
In Progress
     ↓
Resolved
```

Example endpoints:

```http
GET   /api/issues
POST  /api/issues
GET   /api/issues/:id
PATCH /api/issues/:id/status
DELETE /api/issues/:id
```

---

## 📦 Lost & Found

The platform includes a campus lost-and-found module for reporting and discovering misplaced items.

Users can provide information including:

- Item name
- Category
- Description
- Location
- Date
- USN/contact information
- Item image
- Recovery status

The frontend also supports local persistence as a fallback.

---

## 📢 Campus Services

The backend includes additional campus-service modules for:

- Announcements
- Events
- Clubs
- Notifications
- Lost & Found

These services are exposed through dedicated REST API routes.

---

# 🧩 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Animation | Framer Motion |
| Icons | Lucide React |
| Maps | Google Maps JavaScript API |
| Maps | Mapbox GL |
| Backend | Node.js |
| API Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcryptjs |
| Security Headers | Helmet |
| API Protection | Express Rate Limit |
| Cross-Origin Requests | CORS |
| Configuration | dotenv |
| Deployment | Vercel / GitHub Pages |
| CI/CD | GitHub Actions |

---

# 🏗️ System Architecture

```text
                         ┌───────────────────────┐
                         │        STUDENT        │
                         │      Web Browser      │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   React + TypeScript  │
                         │        Vite           │
                         │                       │
                         │  Campus UI / Routing  │
                         │  Map / Search / AI    │
                         └───────────┬───────────┘
                                     │
                              REST API / HTTPS
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    Node.js + Express  │
                         │        Backend        │
                         │                       │
                         │ Auth / Search / AI    │
                         │ Faculty / Issues      │
                         │ Libraries / Buildings │
                         │ Rooms / Services      │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │        MongoDB        │
                         │       Database        │
                         │                       │
                         │ Users / Faculty       │
                         │ Buildings / Rooms     │
                         │ Libraries / Issues    │
                         │ Other campus data     │
                         └───────────────────────┘
```

---

# 🔄 End-to-End Execution Flow

### Example: Asking Campus AI

```text
User
 │
 │ Natural-language question
 ▼
React Frontend
 │
 │ POST /api/ai/query
 ▼
Express API
 │
 ├── Validate request
 │
 ├── Connect to MongoDB
 │
 ├── Process campus query
 │
 └── Retrieve relevant campus data
 │
 ▼
AI / Campus Query Engine
 │
 ▼
Structured Response
 │
 ▼
React UI
 │
 ▼
Answer + Relevant Campus Information
```

### Example: Campus Issue Reporting

```text
Student
   │
   ▼
Issue Reporting UI
   │
   ▼
POST /api/issues
   │
   ▼
Express Backend
   │
   ▼
Issue Validation
   │
   ▼
MongoDB
   │
   ▼
Stored Issue
   │
   ▼
Issue Status Tracking
```

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
│   ├── pages/
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
│   ├── API.md
│   ├── .env.example
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

# 🔌 API Overview

The backend follows a REST architecture.

| Module | Example Endpoint | Purpose |
|---|---|---|
| Health | `GET /api/health` | API health check |
| Authentication | `POST /api/auth/login` | User authentication |
| Faculty | `GET /api/faculty` | Faculty directory |
| Faculty Search | `GET /api/faculty/search` | Search faculty |
| Libraries | `GET /api/libraries` | Library information |
| Occupancy | `GET /api/libraries/occupancy/current` | Current estimated occupancy |
| Buildings | `GET /api/buildings` | Campus buildings |
| Rooms | `GET /api/rooms` | Campus rooms |
| Issues | `GET /api/issues` | Issue reports |
| Search | `GET /api/search` | Global campus search |
| AI | `POST /api/ai/query` | Campus AI queries |
| Notifications | `GET /api/notifications` | Notifications |
| Events | `/api/events` | Campus events |
| Clubs | `/api/clubs` | Campus clubs |
| Lost & Found | `/api/lost-found` | Lost & found |

Complete API documentation:

```text
server/API.md
```

---

# ⚙️ Installation

## Prerequisites

Install the following:

- Git
- Node.js 20+
- npm
- MongoDB / MongoDB Atlas

The repository's GitHub Actions workflow currently uses **Node.js 20** for frontend builds.

---

## 1. Clone the Repository

```bash
git clone https://github.com/Techno-Crat17/Campus-Pulse.git
cd Campus-Pulse
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

---

## 3. Configure Frontend Environment Variables

Create:

```bash
cp .env.example .env
```

Configure:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Start the Frontend

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🖥️ Backend Setup

Open another terminal:

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

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/campuspulse

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

Start the development server:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

# 🔐 Environment Variables

## Frontend

| Variable | Type | Required | Description | Default |
|---|---|---:|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | String | Yes* | Google Maps JavaScript API key | — |
| `VITE_API_URL` | URL/String | Yes for backend integration | Public/local backend API URL | — |

\* Required for Google Maps functionality.

## Backend

| Variable | Type | Required | Description | Default |
|---|---|---:|---|---|
| `PORT` | Number | No | Express server port | `5000` |
| `NODE_ENV` | String | No | Runtime environment | `development` |
| `MONGODB_URI` | String | Yes | MongoDB connection string | — |
| `JWT_SECRET` | String | Yes | JWT signing secret | — |
| `JWT_EXPIRES_IN` | String | No | JWT lifetime | `7d` |
| `CLIENT_URL` | URL | No | Frontend origin used by the backend | `http://localhost:5173` |

**Never commit `.env` files, database credentials, JWT secrets, or API keys.**

---

# ▶️ Available Commands

## Frontend

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |
| `npm run server` | Start backend from repository root |
| `npm run dev:server` | Start backend development server |
| `npm run seed` | Run backend database seed script |

## Backend

```bash
cd server
```

| Command | Purpose |
|---|---|
| `npm run dev` | Start backend with Nodemon |
| `npm start` | Start backend |
| `npm run seed` | Seed MongoDB |

---

# 🧪 Testing & Quality Control

### Frontend linting

```bash
npm run lint
```

### Production build verification

```bash
npm run build
```

### Backend startup verification

```bash
cd server
npm start
```

### API health check

```bash
curl http://localhost:5000/api/health
```

The current repository does **not** define a dedicated frontend unit-test or integration-test command in `package.json`. Backend development dependencies include `mongodb-memory-server`, but a formal automated test suite is not exposed as an npm script.

---

# 🚀 CI/CD & Deployment

The repository contains a GitHub Actions workflow:

```text
.github/workflows/deploy.yml
```

The frontend deployment pipeline performs:

```text
Git Push
   │
   ▼
GitHub Actions
   │
   ▼
Node.js 20
   │
   ▼
npm ci
   │
   ▼
npm run build
   │
   ▼
Vite Production Build
   │
   ▼
GitHub Pages Artifact
   │
   ▼
GitHub Pages
```

The workflow also injects the Google Maps API key through a GitHub Actions secret.

### Backend Deployment

The backend is designed to run separately as a Node.js/Express service.

```text
React Frontend
      │
      │ HTTPS
      ▼
Node.js + Express
      │
      ▼
MongoDB Atlas
```

---

# 🛡️ Security

Campus Pulse includes several backend security mechanisms:

- JWT-based authentication
- Password hashing using bcrypt
- Helmet security headers
- CORS configuration
- Express rate limiting
- Centralized error handling
- Environment-based secrets
- Role-based protected admin routes

### Security principles

```text
User
 │
 ▼
Authentication
 │
 ▼
JWT
 │
 ▼
Protected Route
 │
 ▼
Authorization
 │
 ▼
Controller
 │
 ▼
Database
```

Sensitive values such as:

```text
MONGODB_URI
JWT_SECRET
API KEYS
```

must remain outside source control.

### Vulnerability Reporting

For security vulnerabilities, avoid publishing sensitive exploit details in a public issue.

If private vulnerability reporting is enabled for the repository, use GitHub's private security reporting mechanism. Otherwise, contact the project maintainers privately through the repository's available contact channels.

---

# ⚡ Reliability & Current Maturity

### Current Status

**Hackathon MVP / Demonstration Build**

Campus Pulse currently combines:

- Production-style REST APIs
- MongoDB persistence
- JWT authentication
- Campus datasets
- Frontend fallback data
- Interactive mapping
- AI query functionality
- Issue reporting
- Campus service modules
- Automated frontend deployment

### Important Data Limitations

Some information is currently based on static or estimated datasets rather than live institutional systems.

Examples include:

- Library occupancy
- Faculty availability
- Campus datasets
- Some campus service information

Therefore, the platform should not be interpreted as a direct real-time integration with institutional systems unless such an integration is explicitly configured.

---

# ⚠️ Known Limitations & Trade-offs

| Area | Current State | Limitation / Trade-off |
|---|---|---|
| Library occupancy | Estimated | Not based on live sensors |
| Faculty status | Calculated from available data | May not represent physical real-time presence |
| Campus data | Verified/static datasets | Requires periodic maintenance |
| Backend deployment | Separate service | Frontend hosting alone does not execute Express |
| AI | Campus-grounded query engine | Responses depend on available campus data |
| Offline behavior | Frontend fallbacks | Not equivalent to full backend offline operation |
| Automated testing | Limited | No dedicated test command currently exposed |
| Mapping | Google Maps + Mapbox | Requires correctly configured API credentials |

---

# 📊 Performance & Benchmarks

Formal latency, throughput, load-test, and scalability benchmarks are **not currently included in the repository**.

Recommended future benchmark coverage:

```text
API Response Latency
Database Query Latency
Concurrent API Requests
AI Query Response Time
Frontend Build Size
Initial Page Load
Map Initialization Time
```

This section should be updated once reproducible benchmark measurements are available.

---

# 🗄️ Database

Campus Pulse uses:

**MongoDB + Mongoose**

The backend contains models for major campus entities including:

```text
Users
Faculty
Libraries
Library Occupancy
Buildings
Rooms
Issues
Lost & Found
Clubs
```

MongoDB provides persistent storage while Mongoose handles schema definition, validation, and database interaction.

The backend also includes a seed system:

```bash
npm run seed
```

---

# 🔐 Authentication & Authorization

Authentication uses JSON Web Tokens.

### Authentication flow

```text
Register / Login
      │
      ▼
Express Authentication API
      │
      ▼
Password Verification
      │
      ▼
JWT Generation
      │
      ▼
Frontend
      │
      ▼
Authorization Header
      │
      ▼
Protected API
```

Example:

```http
Authorization: Bearer <JWT_TOKEN>
```

The system supports student and admin roles, with protected administrative operations.

---

# 📚 Documentation

Additional technical documentation:

| Document | Purpose |
|---|---|
| `README.md` | Project overview and setup |
| `server/API.md` | REST API documentation |
| `.env.example` | Environment configuration reference |
| `.github/workflows/deploy.yml` | CI/CD configuration |

---

# 🤝 Development & Contribution

For development:

```bash
git checkout -b feat/your-feature
```

Recommended branch prefixes:

```text
feat/      New functionality
fix/       Bug fixes
refactor/  Code restructuring
docs/      Documentation
chore/     Maintenance
```

Before submitting changes:

```bash
npm run lint
npm run build
```

Keep secrets out of commits and document new environment variables in `.env.example`.

---

# 🛣️ Future Roadmap

Potential future development includes:

### 1. Real-Time Campus Telemetry

Integration with authorized campus data sources or sensors for:

- Library occupancy
- Study-space availability
- Campus footfall
- Facility status

### 2. Expanded AI Assistant

Future versions could support:

- More campus services
- Better contextual reasoning
- Personalized campus recommendations
- Voice interaction
- Multi-turn campus workflows

### 3. Progressive Web App

The frontend already contains PWA-related components and can be extended with:

- Installable application
- Offline caching
- Push notifications
- Mobile-first workflows

### 4. Institutional Integrations

Where officially authorized:

- Student information systems
- Faculty systems
- Campus directories
- Institutional notifications
- Authentication systems

### 5. Multi-Campus Architecture

The Campus Pulse concept can be adapted beyond MSRIT by replacing campus-specific datasets and configuration with institution-specific modules.

```text
                 CAMPUS PULSE PLATFORM
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
        MSRIT          College B       College C
          │               │               │
       Campus          Campus          Campus
        Data            Data            Data
```

---

# 🏆 ASYNC'26

Campus Pulse was developed as a project for **ASYNC'26**.

The platform demonstrates the integration of:

```text
Frontend Engineering
        +
Backend Engineering
        +
Database Systems
        +
AI
        +
Geospatial Technology
        +
Campus Intelligence
```

---

# 📄 License

No explicit open-source license file is currently provided in the repository.

Until a license is added, the repository should **not be assumed to grant unrestricted rights to copy, modify, or redistribute the source code**.

---

# 🔗 Project Links

- **Live Application:** https://campus-pulse-mu-bice.vercel.app/
- **GitHub Repository:** https://github.com/Techno-Crat17/Campus-Pulse/

---

## Campus Pulse

### **Ask your campus. See your campus. Navigate your campus. Improve your campus.**
