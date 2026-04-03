# Employee WFH Attendance System

A responsive web-based WFH attendance system with two applications:
- **Employee App** — Login, profile management, clock in/out, attendance summary
- **Admin HRD App** — Employee CRUD, attendance monitoring, real-time notifications

## Tech Stack

- **Backend**: NestJS 10, TypeORM, MySQL 8, Passport/JWT, kafkajs, SSE
- **Frontend**: React 18, React Router 6, Axios, Tailwind CSS 4
- **Infrastructure**: Docker Compose (MySQL + Kafka KRaft)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Employee App    │     │   Admin App     │
│  (React :5173)   │     │  (React :5174)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │ REST API
              ┌──────┴──────┐
              │   NestJS    │
              │  Backend    │──── SSE ──→ Admin App
              │  (:3000)    │
              └──┬───┬──────┘
                 │   │
          ┌──────┘   └──────┐
          │                 │
     ┌────┴────┐    ┌──────┴──────┐
     │  MySQL  │    │    Kafka    │
     │ :3306   │    │   :9092     │
     └─────────┘    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Consumers  │
                    │  Audit+SSE  │
                    └─────────────┘
```

## Prerequisites

- Node.js 20 LTS
- Docker & Docker Compose

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts MySQL 8 (port 3306) and Kafka KRaft (port 9092).

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

The backend starts at http://localhost:3000.

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Employee App

```bash
cd frontend/employee-app
npm install
npm run dev
```

Opens at http://localhost:5173.

### 5. Admin App

```bash
cd frontend/admin-app
npm install
npm run dev
```

Opens at http://localhost:5174.

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Employee | john@company.com | employee123 |
| Employee | jane@company.com | employee123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh token

### Employees
- `GET /api/employees/me` — Get profile
- `PATCH /api/employees/me` — Update profile (photo/phone/password)
- `GET /api/employees` — List employees (admin)
- `POST /api/employees` — Create employee (admin)
- `PATCH /api/employees/:id` — Update employee (admin)

### Attendance
- `POST /api/attendance/clock-in` — Clock in
- `POST /api/attendance/clock-out` — Clock out
- `GET /api/attendance/today` — Today's record
- `GET /api/attendance/summary` — Attendance summary with date filter
- `GET /api/attendance/all` — All attendance records (admin)

### Notifications
- `GET /api/notifications/stream?token=<jwt>` — SSE notification stream (admin)

## Project Structure

```
├── backend/                 # NestJS API server
│   └── src/
│       ├── auth/            # JWT authentication
│       ├── employees/       # Employee CRUD + profile
│       ├── attendance/      # Clock in/out + summary
│       ├── kafka/           # Kafka producer + consumer
│       ├── notifications/   # SSE notifications
│       ├── audit/           # Audit log consumer
│       └── common/          # Guards, filters, decorators
├── frontend/
│   ├── employee-app/        # Employee SPA (React + Vite)
│   └── admin-app/           # Admin HRD SPA (React + Vite)
├── docker-compose.yml       # MySQL + Kafka
└── specs/                   # Feature specifications
```
