# Session Booking Platform — Backend REST API

A clean, modular REST API built with **Node.js**, **TypeScript**, **Express.js**, **MongoDB**, and **Mongoose** for a teacher–student session booking platform. Teachers create available sessions, users book open slots, sessions can be marked completed, and users can view their upcoming and completed session history powered by **MongoDB Aggregation Pipelines**.

---

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript (`strict: true`, `NodeNext`)
- **Web Framework**: Express.js 5
- **Database & ODM**: MongoDB + Mongoose
- **Validation**: `express-validator` + `zod` (environment validation)
- **Security & Middleware**: `helmet`, `cors`, `hpp`, `compression`, `express-rate-limit`, `morgan`
- **Logging**: `pino` + `pino-pretty`

---

## Project Structure

```txt
server/
├── postman/
│   └── session-booking-api.postman_collection.json
├── src/
│   ├── config/
│   │   ├── env.ts                     # Zod-validated environment configuration
│   │   └── logger.ts                  # Structured Pino logger
│   ├── constant/
│   │   └── app.constant.ts            # Defaults & SessionStatus constants
│   ├── database/
│   │   └── db.ts                      # Async/await Mongoose connection lifecycle
│   ├── middlewares/
│   │   ├── errorHandler.middleware.ts # Centralized error handling
│   │   ├── notFound.middleware.ts     # 404 handler for unmatched routes
│   │   └── security.middleware.ts     # Helmet, CORS, HPP, compression, rate limiter
│   ├── models/
│   │   ├── user.model.ts              # User schema
│   │   ├── teacher.model.ts           # Teacher schema
│   │   └── session.model.ts           # Session schema + compound indexes
│   ├── modules/
│   │   ├── user/                      # POST /users, GET /users, GET /users/:id/sessions
│   │   ├── teacher/                   # POST /teachers, GET /teachers
│   │   └── session/                   # POST /sessions, GET /sessions/available, POST /sessions/:id/book, PATCH /sessions/:id/complete
│   ├── repository/
│   │   ├── user.repo.ts
│   │   ├── teacher.repo.ts
│   │   └── session.repo.ts            # Includes MongoDB Aggregation Pipelines for API 3 & API 6
│   ├── scripts/
│   │   └── seed.ts                    # Optional sample data seeder
│   ├── shared/
│   │   └── error/
│   │       ├── ApiError.ts
│   │       └── globalError.ts
│   ├── utils/
│   │   ├── asyncHandler.ts            # Pure async/await Express wrapper
│   │   ├── date.util.ts               # Timestamp/date parsing & UTC day bounds
│   │   └── validRequest.ts            # Validation result formatter
│   ├── validation/
│   │   ├── user.validation.ts
│   │   ├── teacher.validation.ts
│   │   └── session.validation.ts
│   └── app.ts                         # Express app factory
├── server.ts                          # Entry point with graceful shutdown
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Database Schemas

### User (`users`)
| Field | Type | Constraints |
| --- | --- | --- |
| `fullName` | `String` | Required, trimmed |
| `email` | `String` | Required, **unique**, lowercase, trimmed |
| `phone` | `String` | Required, trimmed |
| `createdAt` / `updatedAt` | `Date` | Automatic (`timestamps: true`) |

### Teacher (`teachers`)
| Field | Type | Constraints |
| --- | --- | --- |
| `fullName` | `String` | Required, trimmed |
| `email` | `String` | Required, unique, lowercase, trimmed |
| `specialization` | `String` | Required, trimmed |
| `experience` | `Number` | Required, min `0` |
| `createdAt` / `updatedAt` | `Date` | Automatic (`timestamps: true`) |

### Session (`sessions`)
| Field | Type | Constraints |
| --- | --- | --- |
| `teacherId` | `ObjectId` | Required, ref `Teacher`, indexed |
| `userId` | `ObjectId \| null` | Default `null`, ref `User`, indexed |
| `startTime` | `Date` | Required, indexed |
| `endTime` | `Date` | Required, must be strictly greater than `startTime` |
| `status` | `String` | Enum `AVAILABLE` \| `BOOKED` \| `COMPLETED`, default `AVAILABLE` |
| `completedAt` | `Date \| null` | Default `null` |
| `createdAt` / `updatedAt` | `Date` | Automatic (`timestamps: true`) |

---

## Setup Instructions

### Prerequisites

- **Node.js** v20+ (tested on v26)
- **MongoDB** v6+ running locally or a MongoDB Atlas connection string

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values if needed:

```bash
cp .env.example .env
```

`.env` variables:

```env
PORT=3000
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/session_booking
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Run the Server

- **Development (with hot reload):**
  ```bash
  npm run dev
  ```
- **Type-check:**
  ```bash
  npm run typecheck
  ```
- **Production build & start:**
  ```bash
  npm run build
  npm start
  ```
- **Optional — Seed sample teachers, user, and sessions:**
  ```bash
  npm run seed
  ```

---

## API Reference

### API 1 — Create User
`POST /users`

Creates a new user with a unique email address.

- **Request Body:**
  ```json
  {
    "fullName": "Arun Kumar",
    "email": "arun@example.com",
    "phone": "+919876543210"
  }
  ```
- **Responses:** `201 Created`, `400 Bad Request` (validation error), `409 Conflict` (duplicate email)

---

### API 2 — Create Session
`POST /sessions`

Creates a new session for an existing teacher with default status `AVAILABLE`. Validates that the teacher exists and `endTime > startTime`.

- **Request Body:**
  ```json
  {
    "teacherId": "<teacherObjectId>",
    "startTime": "2026-11-20T09:00:00.000Z",
    "endTime": "2026-11-20T10:00:00.000Z"
  }
  ```
  *(Accepts ISO 8601 date strings or Unix timestamps in milliseconds/seconds.)*
- **Responses:** `201 Created`, `400 Bad Request` (invalid input / `endTime <= startTime`), `404 Not Found` (teacher does not exist)

---

### API 3 — Available Sessions for Booking *(MongoDB Aggregation Pipeline)*
`GET /sessions/available?dateTimestamp={timestamp}`

Returns all `AVAILABLE` sessions scheduled on the UTC date of `dateTimestamp`, enriched with teacher details via `$lookup`, `$unwind`, `$sort`, and `$project`.

- **Query Parameters:**
  - `dateTimestamp` (required): Unix timestamp in ms (e.g. `1795132800000`), Unix timestamp in seconds, or ISO date string (`2026-11-20`).
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Available sessions retrieved successfully",
    "meta": {
      "date": "2026-11-20",
      "count": 1
    },
    "data": [
      {
        "_id": "...",
        "teacherId": "...",
        "userId": null,
        "startTime": "2026-11-20T09:00:00.000Z",
        "endTime": "2026-11-20T10:00:00.000Z",
        "status": "AVAILABLE",
        "completedAt": null,
        "teacher": {
          "_id": "...",
          "fullName": "Dr. Ananya Sharma",
          "email": "ananya.sharma@platform.edu",
          "specialization": "Backend & Distributed Systems",
          "experience": 9
        }
      }
    ]
  }
  ```

---

### API 4 — Book Session
`POST /sessions/:id/book`

Atomically books an `AVAILABLE` session for an existing user (race-condition safe via `findOneAndUpdate` on `{ _id, status: "AVAILABLE" }`).

- **Request Body:**
  ```json
  {
    "userId": "<userObjectId>"
  }
  ```
- **Responses:**
  - `200 OK` — Session status updated to `BOOKED` and linked to `userId`
  - `400 Bad Request` — Invalid ObjectId
  - `404 Not Found` — User or session not found
  - `409 Conflict` — Session is already booked or completed

---

### API 5 — Mark Session Complete
`PATCH /sessions/:id/complete`

Atomically marks a `BOOKED` session as `COMPLETED` and sets `completedAt`.

- **Responses:**
  - `200 OK` — Session status updated to `COMPLETED` with `completedAt` timestamp
  - `400 Bad Request` — Invalid ObjectId or session is still `AVAILABLE` (not booked)
  - `404 Not Found` — Session not found
  - `409 Conflict` — Session is already completed

---

### API 6 — User Session List *(MongoDB Aggregation Pipeline)*
`GET /users/:id/sessions`

Uses a MongoDB Aggregation Pipeline (`$match` → `$lookup` → `$unwind` → `$project` → `$facet`) to return all sessions belonging to the user separated into `upcomingSessions` (`BOOKED`) and `completedSessions` (`COMPLETED`).

- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "User sessions retrieved successfully",
    "meta": {
      "upcomingCount": 1,
      "completedCount": 1
    },
    "data": {
      "upcomingSessions": [],
      "completedSessions": []
    }
  }
  ```
- **Responses:** `200 OK`, `400 Bad Request` (invalid user ID), `404 Not Found` (user does not exist)

---

### Helper Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/teachers` | Create a teacher (`fullName`, `email`, `specialization`, `experience`) |
| `GET` | `/teachers` | List all teachers |
| `GET` | `/users` | List all users |
| `GET` | `/health` | Health check |

---

## Postman Collection

Import [`postman/session-booking-api.postman_collection.json`](./postman/session-booking-api.postman_collection.json) into Postman:

1. Ensure MongoDB and the API server (`npm run dev`) are running.
2. Open Postman → **Import** → select `server/postman/session-booking-api.postman_collection.json`.
3. Run the collection using **Collection Runner** (or run requests in folder order `0` → `7`).
   - Built-in Postman scripts automatically capture `teacherId`, `userId`, `sessionId`, and `sessionId2` into collection variables and verify status codes and business rules (including duplicate email, invalid time range, double-booking prevention, and aggregation outputs).
