# Duty Management System

A modern web-based Duty Management System built for planning, assigning and managing operational duty rosters.

Designed for organizations that need a simple overview of personnel, teams, duty rules and schedules.

---

## Features

### Dashboard

- Operational overview
- Employee statistics
- Team overview
- Duty rule count
- Assignment statistics

![Dashboard](docs/images/dashboard.png)

---

### Monthly Schedule

- Monthly calendar view
- Weekday assignments
- Weekend duty visualization
- Click-to-assign, edit and delete duty assignments
- Fully persisted to the backend, with automatic refresh
- Navigation between months

![Schedule](docs/images/schedule.png)

---

### Employee Management

- Create employees
- Edit employees
- Delete employees
- Search employees
- Team assignment

![Employees](docs/images/employees.png)

---

### Roster Generation

- Automatically generates duty assignments for a chosen team and month, driven by that team's duty rules (`FIXED` and `ROTATION`)
- Preview shows each day's outcome before committing: already scheduled, will be created, unassigned (manual/no rule), or holiday
- Optional overwrite of existing assignments when a rule changes
- Idempotent — re-running never duplicates assignments

---

### Holidays

- Company-wide or per-employee holidays, as single days or multi-day ranges
- Overlap detection prevents duplicate/conflicting entries per employee
- Roster generation automatically skips any day covered by a matching holiday, so affected days stay unassigned for manual handling

---

## Planned Features

- Duty Rules management page (frontend)
- Teams management page (frontend)
- Duty conflict detection (e.g. double-booking, missing rotation members)
- Employee availability
- Reporting
- PDF / Excel export
- Email notifications
- Audit log
- Authentication
- Role based permissions

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Material UI
- React Router

### Backend

- NestJS
- Prisma ORM
- PostgreSQL

---

## Project Structure

```
DutyManagementSystem/
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
│   └── images/
│
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
npm install

# configure backend/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/duty"
# PORT=3001

npx prisma migrate deploy   # or `npx prisma migrate dev` in development
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install

# configure frontend/.env
# VITE_API_URL=/api   (or the backend's base URL)

npm run dev
```

---

## Current Progress

| Module | Status |
|---------|--------|
| Dashboard | ✅ |
| Employees | ✅ |
| Teams | 🚧 (backend done, frontend page pending) |
| Duty Rules | 🚧 (backend done, frontend page pending) |
| Schedule | ✅ |
| Roster Engine | ✅ |
| Holidays | ✅ |
| Reports | ⏳ |
| Settings | ⏳ |

---

## Roadmap

### Phase 1
- Employee management
- Team management
- Duty rules
- Manual scheduling

### Phase 2
- Automatic roster generation
- Holiday handling
- Conflict detection

### Phase 3
- Reporting
- PDF export
- Notifications
- Authentication

---

## License

Private project.
