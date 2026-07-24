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

  ![Roster](docs/images/Roster.png)

---

### Holidays

- Company-wide or per-employee holidays, as single days or multi-day ranges
- Overlap detection prevents duplicate/conflicting entries per employee
- Roster generation automatically skips any day covered by a matching holiday, so affected days stay unassigned for manual handling

![Holidays](docs/images/Holidays.png)

---

### Teams

- Create, edit and delete teams (name, description, color)
- Color is used consistently across Employees, Schedule, Roster and Duty Rules
- Deletion is blocked with a clear message while a team still has employees, duty rules, or assignments linked to it

![Teams](docs/images/Teams.png)

---

### Duty Rules

- Per-team, per-weekday rules: `FIXED` (always the same employee), `ROTATION` (rotates weekly across the team), or `MANUAL` (assigned by hand)
- Filterable by team, with duplicate team/weekday rules rejected
- Directly drives Roster Generation

![Duty Rules](docs/images/Dutyrules.png)

---

### Light / Dark Mode

- Toggle in the top bar, with the choice persisted and the OS preference respected on first load
- Full theme system — all pages and layout chrome adapt, not just a background swap

![Lightmode](docs/images/Lightmode.png)
![Darkmode](docs/images/Darkmode.png)

---

### Reports

- Monthly, per-team report: days covered, who had duty when, and full duty pay breakdown
- Duty pay rates: **1250 DKK** per weekday duty, **6000 DKK** flat per weekend duty block (Fri–Sun covered by the same person, however many days), **2250 DKK** for a duty on a company-wide holiday — weekend pay wins if a holiday falls on a weekend day
- Per-employee summary (days worked, total pay) alongside the full daily duty log
- Export to Excel (.xlsx, multi-sheet) and PDF

---

## Planned Features

- Duty conflict detection (e.g. double-booking, missing rotation members)
- Employee availability
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
| Teams | ✅ |
| Duty Rules | ✅ |
| Schedule | ✅ |
| Roster Engine | ✅ |
| Holidays | ✅ |
| Reports | ✅ |
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
